import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import crypto from "crypto";

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || "https://minella.in";
const GAS_URL = process.env.GAS_URL || "";
const PAYU_KEY = process.env.PAYU_KEY || "";
const PAYU_SALT = process.env.PAYU_SALT || "";
const PAYU_URL =
  process.env.NEXT_PUBLIC_PAYU_URL || "https://secure.payu.in/_payment";

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
    const verifiedGrand =
      verifiedSubtotal + verifiedShipping + verifiedCodCharge;

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
      cartData:
        typeof cartData === "string" ? cartData : JSON.stringify(cartData),
      status: isCod ? "Order Placed" : "Awaiting Payment",
      createdAt: new Date(),
    });

    // Decrement stock
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

    // Call GAS for email only
    if (GAS_URL) {
      fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: isCod ? "sendCodEmail" : "sendAwaitingEmail",
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
        }),
      }).catch(() => {});
    }

    if (isCod) {
      return NextResponse.json({ ok: true, orderId });
    }

    // Build PayU fields
    // Hash: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
    const amount = verifiedGrand.toFixed(2);
    const productinfo = `Minella Jewels Order ${orderId}`;
    const firstname = name.split(" ")[0];
    const udf1 = orderId;
    const udf2 = (pincode || "").toString();
    const udf3 = "";
    const udf4 = "";
    const udf5 = "";

    const hashStr = `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${PAYU_SALT}`;
    const hash = crypto.createHash("sha512").update(hashStr).digest("hex");

    return NextResponse.json({
      ok: true,
      orderId,
      payuUrl: PAYU_URL,
      formFields: {
        key: PAYU_KEY,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone,
        surl: `${STORE_URL}/api/payu-webhook`,
        furl: `${STORE_URL}/api/payu-webhook`,
        hash,
        udf1,
        udf2,
        udf3,
        udf4,
        udf5,
      },
    });
  } catch (e: any) {
    console.error("place-order error:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Server error" },
      { status: 500 },
    );
  }
}
