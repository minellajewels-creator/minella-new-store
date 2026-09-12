import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const GAS_URL = process.env.GAS_URL || "";

function generateOrderId() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `MNL-${date}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      address,
      items,
      shipping,
      paymentMethod,
      cartData,
      pincode,
    } = body;

    const db = getAdminDb();
    const isCod = paymentMethod === "Cash on Delivery";
    const orderId = generateOrderId();
    const txnid = isCod ? `COD-${Date.now()}` : `MNL${Date.now()}`;

    const cart: Array<{
      id: string;
      title: string;
      qty: number;
      price: number;
    }> = Array.isArray(cartData)
      ? cartData
      : JSON.parse(typeof cartData === "string" ? cartData : "[]");

    // Verify prices + stock from Firestore — never trust browser
    let verifiedSubtotal = 0;
    for (const item of cart) {
      if (!item.id) continue;
      const snap = await db.collection("products").doc(String(item.id)).get();
      if (!snap.exists) throw new Error(`Product not found: ${item.title}`);
      const p = snap.data()!;
      if ((p.stocks ?? 0) < item.qty)
        throw new Error(`Insufficient stock: ${item.title}`);
      verifiedSubtotal += p.price * item.qty;
    }

    const verifiedShipping = verifiedSubtotal >= 999 ? 0 : (shipping ?? 0);
    const verifiedCodCharge = isCod
      ? Math.max(40, Math.round(verifiedSubtotal * 0.02))
      : 0;
    const verifiedGrand = verifiedSubtotal + verifiedShipping + verifiedCodCharge;

    // Write order to Firestore
    await db.collection("orders").add({
      orderId,
      txnid,
      name,
      phone,
      email,
      address,
      items,
      subtotal: verifiedSubtotal,
      shipping: verifiedShipping,
      codCharge: verifiedCodCharge,
      grandTotal: verifiedGrand,
      paymentMethod,
      cartData: typeof cartData === "string" ? cartData : JSON.stringify(cartData),
      status: isCod ? "Order Placed" : "Awaiting Payment",
      createdAt: new Date(),
    });

    if (isCod) {
      // COD: deduct stock immediately
      await db.runTransaction(async (tx) => {
        for (const item of cart) {
          if (!item.id) continue;
          const ref = db.collection("products").doc(String(item.id));
          const snap = await tx.get(ref);
          if (!snap.exists) continue;
          const cur = (snap.data()?.stocks ?? 0) as number;
          tx.update(ref, { stocks: Math.max(0, cur - item.qty) });
        }
      });

      if (GAS_URL) {
        fetch(GAS_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "sendCodEmail",
            orderId, txnid, name, phone, email, address, items,
            subtotal: verifiedSubtotal,
            shipping: verifiedShipping,
            codCharge: verifiedCodCharge,
            grandTotal: verifiedGrand,
            paymentMethod,
          }),
        }).catch(() => {});
      }

      return NextResponse.json({ ok: true, orderId });
    }

    // Online payment — create Razorpay order
    // Amount must be in paise (multiply by 100)
    const amountPaise = Math.round(verifiedGrand * 100);
    if (amountPaise < 100) throw new Error("Minimum order amount is ₹1");

    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: txnid,
        notes: {
          orderId,
          name,
          phone,
          email,
        },
      }),
    });

    if (!rzpRes.ok) {
      const err = await rzpRes.json();
      throw new Error(err?.error?.description || "Razorpay order creation failed");
    }

    const rzpOrder = await rzpRes.json();

    return NextResponse.json({
      ok: true,
      orderId,
      txnid,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,      // paise
      currency: rzpOrder.currency,
      name,
      phone,
      email,
    });
  } catch (e: any) {
    console.error("create-order error:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Server error" },
      { status: 500 },
    );
  }
}
