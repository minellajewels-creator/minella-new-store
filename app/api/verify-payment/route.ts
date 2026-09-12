import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import crypto from "crypto";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const GAS_URL = process.env.GAS_URL || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      txnid,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { ok: false, error: "Missing payment fields" },
        { status: 400 },
      );
    }

    // Verify signature — HMAC-SHA256(order_id|payment_id, KEY_SECRET)
    const generated = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated !== razorpay_signature) {
      console.error("Razorpay signature mismatch", {
        razorpay_order_id,
        razorpay_payment_id,
      });
      return NextResponse.json(
        { ok: false, error: "Payment verification failed" },
        { status: 400 },
      );
    }

    // Signature valid — update order in Firestore
    const db = getAdminDb();
    const snap = await db
      .collection("orders")
      .where("txnid", "==", txnid)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404 },
      );
    }

    const orderRef = snap.docs[0].ref;
    const orderData = snap.docs[0].data();

    // Idempotency — don't process twice
    if (orderData.status === "Order Placed") {
      return NextResponse.json({ ok: true, orderId: orderData.orderId });
    }

    // Update order status
    await orderRef.update({
      status: "Order Placed",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignatureVerified: true,
      updatedAt: new Date(),
    });

    // Deduct stock after payment confirmed
    const cartData = orderData.cartData || "[]";
    const cart: Array<{ id: string; qty: number }> = JSON.parse(
      typeof cartData === "string" ? cartData : JSON.stringify(cartData),
    );

    if (cart.length) {
      await db.runTransaction(async (tx) => {
        for (const item of cart) {
          if (!item.id) continue;
          const ref = db.collection("products").doc(String(item.id));
          const s = await tx.get(ref);
          if (!s.exists) continue;
          const cur = (s.data()?.stocks ?? 0) as number;
          tx.update(ref, { stocks: Math.max(0, cur - item.qty) });
        }
      });
    }

    // Send confirmation email via GAS
    if (GAS_URL) {
      fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "sendConfirmationEmail",
          orderId: orderData.orderId,
          txnid,
          name: orderData.name,
          phone: orderData.phone,
          email: orderData.email,
          items: orderData.items,
          grandTotal: orderData.grandTotal,
          paymentMethod: orderData.paymentMethod,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, orderId: orderData.orderId });
  } catch (e: any) {
    console.error("verify-payment error:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Server error" },
      { status: 500 },
    );
  }
}
