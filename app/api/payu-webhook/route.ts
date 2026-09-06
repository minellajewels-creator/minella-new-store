import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import crypto from "crypto";

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || "https://minella.in";
const PAYU_SALT = process.env.PAYU_SALT || "";
const GAS_URL = process.env.GAS_URL || "";

function verifyReverseHash(params: Record<string, string>): boolean {
  const {
    hash,
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1 = "",
    udf2 = "",
    udf3 = "",
    udf4 = "",
    udf5 = "",
    status,
  } = params;
  const hashStr = `${PAYU_SALT}|${status}|${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  const expected = crypto.createHash("sha512").update(hashStr).digest("hex");
  return expected === hash;
}

async function decrementStock(
  db: FirebaseFirestore.Firestore,
  cartDataStr: string,
) {
  try {
    const cart: Array<{ id: string; qty: number }> = JSON.parse(
      cartDataStr || "[]",
    );
    if (!cart.length) return;
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
  } catch (e) {
    console.error("decrementStock error:", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    // PayU sends form-encoded body
    const text = await req.text();
    const params: Record<string, string> = {};
    text.split("&").forEach((pair) => {
      const idx = pair.indexOf("=");
      if (idx !== -1) {
        params[decodeURIComponent(pair.slice(0, idx))] = decodeURIComponent(
          pair.slice(idx + 1).replace(/\+/g, " "),
        );
      }
    });

    const { txnid, mihpayid, status } = params;
    const payStatus = (status || "").toLowerCase();

    if (!verifyReverseHash(params)) {
      console.error("PayU hash mismatch for txnid:", txnid);
      return NextResponse.redirect(
        new URL(`/success?method=failed&txnid=${txnid}`, STORE_URL),
      );
    }

    const db = getAdminDb();
    const snap = await db
      .collection("orders")
      .where("txnid", "==", txnid)
      .limit(1)
      .get();

    if (!snap.empty) {
      const orderRef = snap.docs[0].ref;
      const orderData = snap.docs[0].data();

      // Idempotency — don't process twice
      if (orderData.status === "Order Placed") {
        return NextResponse.redirect(
          new URL(`/success?method=online&txnid=${txnid}`, STORE_URL),
        );
      }

      if (payStatus === "success") {
        await orderRef.update({
          status: "Order Placed",
          mihpayid,
          updatedAt: new Date(),
        });

        // Deduct stock only now — payment confirmed
        await decrementStock(db, orderData.cartData || "[]");

        // GAS sends confirmation email
        if (GAS_URL) {
          fetch(GAS_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
              action: "sendConfirmationEmail",
              orderId: orderData.orderId,
              txnid,
              mihpayid,
              name: orderData.name,
              phone: orderData.phone,
              email: orderData.email,
              items: orderData.items,
              grandTotal: orderData.grandTotal,
              paymentMethod: orderData.paymentMethod,
            }),
          }).catch(() => {});
        }

        return NextResponse.redirect(
          new URL(`/success?method=online&txnid=${txnid}`, STORE_URL),
        );
      } else {
        // Payment failed/cancelled — restore stock is NOT needed since we never deducted it
        await orderRef.update({
          status: "Payment Failed",
          updatedAt: new Date(),
        });
        return NextResponse.redirect(
          new URL(`/success?method=failed&txnid=${txnid}`, STORE_URL),
        );
      }
    }

    return NextResponse.redirect(
      new URL(
        `/success?method=${payStatus === "success" ? "online" : "failed"}&txnid=${txnid}`,
        STORE_URL,
      ),
    );
  } catch (e: any) {
    console.error("payu-webhook error:", e);
    return NextResponse.redirect(new URL("/success?method=failed", STORE_URL));
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/", STORE_URL));
}
