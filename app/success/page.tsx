'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function SuccessContent() {
  const params = useSearchParams();
  const method = params.get('method');
  const txnid = params.get('txnid');
  const name = params.get('name');

  const isFailed = method === 'failed';

  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: 20 }}>{isFailed ? '😞' : '🎉'}</div>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.5rem,4vw,2.5rem)', color: 'var(--text)', marginBottom: 12 }}>
        {isFailed ? 'Payment Failed' : 'Order Confirmed!'}
      </h1>
      <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 480, lineHeight: 1.7, marginBottom: 8 }}>
        {isFailed
          ? 'Your payment could not be processed. No amount has been charged. Please try again.'
          : method === 'cod'
            ? `Thank you${name ? ', ' + name : ''}! Your Cash on Delivery order has been placed. We'll dispatch it within 24 hours.`
            : `Payment successful! Your order is confirmed. You'll receive a confirmation email shortly.`}
      </p>
      {txnid && !isFailed && (
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
          Transaction ID: <strong>{txnid}</strong>
        </p>
      )}
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 32 }}>
        Questions? WhatsApp us at <a href="https://wa.me/919080014835" style={{ color: 'var(--gold)' }}>+91 90800 14835</a>
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" style={{ padding: '12px 28px', background: 'var(--plum)', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
          Continue Shopping
        </Link>
        <Link href="/track" style={{ padding: '12px 28px', background: 'var(--border)', color: 'var(--text)', borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
          Track My Order
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: 'calc(60px + var(--safe-top))' }}>
        <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>}>
          <SuccessContent />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}
