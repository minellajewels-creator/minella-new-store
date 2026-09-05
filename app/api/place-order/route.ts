import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import crypto from 'crypto';

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'https://minella.in';
const GAS_URL = process.env.GAS_URL || '';
const PAYU_KEY = process.env.PAYU_KEY || '';
const PAYU_SALT = process.env.PAYU_SALT || '';
const PAYU_URL = process.env.NEXT_PUBLIC_PAYU_URL || 'https://secure.payu.in/_payment';

function generateOrderId() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `MNL-${date}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, phone, email, address, items, subtotal,
      shipping, codCharge = 0, grandTotal, paymentMethod, cartData,
    } = body;

    const db = getAdminDb();
    const orderId = generateOrderId();
    const txnid = paymentMethod === 'Cash on Delivery'
      ? `COD-${Date.now()}`
      : `MNL${Date.now()}`;

    const isCod = paymentMethod === 'Cash on Delivery';

    // 1. Write order to Firestore
    await db.collection('orders').add({
      orderId,
      txnid,
      name, phone, email, address,
      items, subtotal, shipping: shipping ?? 0,
      codCharge: codCharge ?? 0,
      grandTotal,
      paymentMethod,
      cartData: typeof cartData === 'string' ? cartData : JSON.stringify(cartData),
      status: isCod ? 'Order Placed' : 'Awaiting Payment',
      createdAt: new Date(),
    });

    // 2. Decrement stock (transaction)
    const cart: Array<{ id: string; qty: number }> = Array.isArray(cartData)
      ? cartData
      : JSON.parse(typeof cartData === 'string' ? cartData : '[]');

    await db.runTransaction(async (tx) => {
      for (const item of cart) {
        if (!item.id) continue;
        const ref = db.collection('products').doc(String(item.id));
        const snap = await tx.get(ref);
        if (!snap.exists) continue;
        const cur = (snap.data()?.stocks ?? 0) as number;
        tx.update(ref, { stocks: Math.max(0, cur - item.qty) });
      }
    });

    // 3. Notify GAS for email (fire and forget)
    if (GAS_URL) {
      fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: isCod ? 'placeOrder' : 'orderCreated',
          orderId, txnid, name, phone, email, address,
          items, subtotal, shipping, codCharge, grandTotal,
          paymentMethod,
          cartData: typeof cartData === 'string' ? cartData : JSON.stringify(cartData),
        }),
      }).catch(() => {});
    }

    if (isCod) {
      return NextResponse.json({ ok: true, orderId });
    }

    // 4. Build PayU form fields for online payment
    const amount = grandTotal.toFixed(2);
    const productinfo = `Minella Jewels Order ${orderId}`;
    const firstname = name.split(' ')[0];
    const udf1 = orderId;
    const udf2 = address;

    const hashStr = `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|||||${PAYU_SALT}`;
    const hash = crypto.createHash('sha512').update(hashStr).digest('hex');

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
        surl: `${STORE_URL}/success?method=online&txnid=${txnid}`,
        furl: `${STORE_URL}/success?method=failed&txnid=${txnid}`,
        hash,
        udf1,
        udf2,
      },
    });
  } catch (e: any) {
    console.error('place-order error:', e);
    return NextResponse.json({ ok: false, error: e.message || 'Server error' }, { status: 500 });
  }
}
