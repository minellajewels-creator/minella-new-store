import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import crypto from "crypto";

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || "https://minella.in";
const PAYU_SALT = process.env.PAYU_SALT || "";
const GAS_URL = process.env.GAS_URL || "";

// ── Helper: return HTML that immediately navigates to a URL ──
// This replaces NextResponse.redirect() everywhere.
// PayU POSTs to surl/furl and expects a full HTML page back —
// a 302 redirect causes the browser to drop the POST body and
// the page either hangs or shows an error until the user hits Enter.
function htmlRedirect(url: string): NextResponse {
  const safe = url.replace(/"/g, "&quot;");
  return new NextResponse(
    `<!DOCTYPE html><html><head>
      <meta http-equiv="refresh" content="0;url=${safe}">
    </head><body>
      <script>window.location.replace("${safe}");<\/script>
    </body></html>`,
    { status: 200, headers: { "Content-Type": "text/html" } },
  );
}

function verifyReverseHash(params: Record<string, string>): {
  valid: boolean;
  expected: string;
  received: string;
  hashStr: string;
} {
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

  // Official PayU reverse hash:
  // salt|status|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  const hashStr = `${PAYU_SALT}|${status}|${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  const expected = crypto.createHash("sha512").update(hashStr).digest("hex");

  return {
    valid: expected === hash,
    expected,
    received: hash || "",
    hashStr,
  };
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

    // ── Verify hash and store result for audit ──
    const hashResult = verifyReverseHash(params);

    const db = getAdminDb();

    if (!hashResult.valid) {
      console.error("PayU hash mismatch for txnid:", txnid, {
        expected: hashResult.expected,
        received: hashResult.received,
      });

      try {
        await db.collection("payu_logs").add({
          type: "hash_mismatch",
          txnid,
          status: payStatus,
          mihpayid: mihpayid || "",
          receivedHash: hashResult.received,
          expectedHash: hashResult.expected,
          hashStr: hashResult.hashStr,
          allParams: params,
          createdAt: new Date(),
        });
      } catch (_) {}

      // ❌ FAILURE — hash mismatch
      return htmlRedirect(`${STORE_URL}/success?method=failed&txnid=${txnid}`);
    }

    // ── Hash valid — log it for audit trail ──
    try {
      await db.collection("payu_logs").add({
        type: "webhook_received",
        txnid,
        status: payStatus,
        mihpayid: mihpayid || "",
        receivedHash: hashResult.received,
        expectedHash: hashResult.expected,
        createdAt: new Date(),
      });
    } catch (_) {}

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
        // ✅ SUCCESS — already processed
        return htmlRedirect(
          `${STORE_URL}/success?method=online&txnid=${txnid}`,
        );
      }

      if (payStatus === "success") {
        await orderRef.update({
          status: "Order Placed",
          mihpayid,
          payuHashVerified: true,
          updatedAt: new Date(),
        });

        await decrementStock(db, orderData.cartData || "[]");

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

        // ✅ SUCCESS — payment confirmed
        return htmlRedirect(
          `${STORE_URL}/success?method=online&txnid=${txnid}`,
        );
      } else {
        await orderRef.update({
          status: "Payment Failed",
          payuHashVerified: true,
          updatedAt: new Date(),
        });

        // ❌ FAILURE — payment failed/cancelled by user
        return htmlRedirect(
          `${STORE_URL}/success?method=failed&txnid=${txnid}`,
        );
      }
    }

    // ── Order not found in Firestore ──
    // ✅ or ❌ depending on PayU status
    return htmlRedirect(
      `${STORE_URL}/success?method=${payStatus === "success" ? "online" : "failed"}&txnid=${txnid}`,
    );
  } catch (e: any) {
    console.error("payu-webhook error:", e);
    // ❌ FAILURE — unexpected server error
    return htmlRedirect(`${STORE_URL}/success?method=failed`);
  }
}

// GET handles PayU cancel (user presses Back on PayU page — PayU GETs furl)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const txnid = searchParams.get("txnid") || "";
  // ❌ FAILURE — user cancelled via back button
  return htmlRedirect(
    `${STORE_URL}/success?method=failed${txnid ? "&txnid=" + txnid : ""}`,
  );
}
