import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = { title: 'Shipping Policy | Minella Jewels' };

export default function Page() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: 'calc(60px + var(--safe-top))', maxWidth: 760, margin: 'calc(60px + var(--safe-top)) auto 60px', padding: '40px 20px' }}>
        <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(1.8rem,4vw,2.5rem)",color:"var(--plum)",marginBottom:16}}>Shipping Policy</h1><div style={{fontSize:15,color:"var(--muted)",lineHeight:1.8,display:"flex",flexDirection:"column",gap:16}}><p>All orders are dispatched within <strong>1–2 business days</strong> and delivered via <strong>Delhivery</strong>.</p><p>Estimated delivery: <strong>2–6 business days</strong> across India.</p><p><strong>Free shipping</strong> on orders above ₹999. Shipping charges for smaller orders depend on your location and are calculated at checkout.</p><p><strong>Cash on Delivery (COD)</strong> is available across India. A COD handling fee of ₹40 or 2% of order value (whichever is higher) applies.</p><p>A tracking link is shared via SMS and email once your order is dispatched.</p></div>
      </div>
      <Footer />
    </>
  );
}
