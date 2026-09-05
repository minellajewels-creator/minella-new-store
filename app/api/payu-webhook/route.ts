import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import crypto from 'crypto';

const PAYU_SALT = process.env.PAYU_SALT || '';
const GAS_URL = process.env.GAS_URL || '';

function verifyHash(params: Record<string, string>): boolean {
  const { hash, key, txnid, amount, productinfo, firstname, email,
    udf1 = '', udf2 = '', udf3 = '', udf4 = '', udf5 = '', status } = params;
  const hashStr = `${PAYU_SALT}|${status}|${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  const expected = crypto.createHash('sha512').update(hashStr).digest('hex');
  return expected === hash;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((v, k) => { params[k] = String(v); });

    const { txnid, status, mihpayid } = params;

    if (!verifyHash(params)) {
      console.error('PayU hash mismatch for txnid:', txnid);
      return NextResponse.redirect(new URL(`/success?method=failed&txnid=${txnid}`, req.url));
    }

    const db = getAdminDb();

    // Find order by txnid and update status
    const snap = await db.collection('orders').where('txnid', '==', txnid).limit(1).get();
    if (!snap.empty) {
      const orderRef = snap.docs[0].ref;
      const orderData = snap.docs[0].data();
      const newStatus = status === 'success' ? 'Order Placed' : 'Payment Failed';

      await orderRef.update({ status: newStatus, mihpayid: mihpayid || '', updatedAt: new Date() });

      // Notify GAS
      if (GAS_URL && status === 'success') {
        fetch(GAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'paymentSuccess', txnid, mihpayid, ...orderData }),
        }).catch(() => {});
      }
    }

    const redirectMethod = status === 'success' ? 'online' : 'failed';
    return NextResponse.redirect(new URL(`/success?method=${redirectMethod}&txnid=${txnid}`, req.url));
  } catch (e: any) {
    console.error('webhook error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PayU also sends GET for some callbacks
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/', req.url));
}
