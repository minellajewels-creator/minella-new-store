import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = { title: 'Return & Refund Policy | Minella Jewels' };

export default function Page() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: 'calc(60px + var(--safe-top))', maxWidth: 760, margin: 'calc(60px + var(--safe-top)) auto 60px', padding: '40px 20px' }}>
        <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(1.8rem,4vw,2.5rem)",color:"var(--plum)",marginBottom:16}}>Return &amp; Refund Policy</h1><div style={{fontSize:15,color:"var(--muted)",lineHeight:1.8,display:"flex",flexDirection:"column",gap:16}}><p>We offer a <strong>7-day return window</strong> from the date of delivery for items that are unused and in original condition.</p><p>To initiate a return, WhatsApp us at <a href="https://wa.me/919080014835" style={{color:"var(--gold)"}}>+91 90800 14835</a> with your order ID and photos of the item.</p><p>Refunds are processed within 5–7 business days to the original payment method after we receive the returned item.</p><p>COD orders are refunded as store credit or bank transfer.</p></div>
      </div>
      <Footer />
    </>
  );
}
