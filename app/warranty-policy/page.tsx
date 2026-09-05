import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = { title: 'Warranty Policy | Minella Jewels' };

export default function Page() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: 'calc(60px + var(--safe-top))', maxWidth: 760, margin: 'calc(60px + var(--safe-top)) auto 60px', padding: '40px 20px' }}>
        <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(1.8rem,4vw,2.5rem)",color:"var(--plum)",marginBottom:16}}>Warranty Policy</h1><div style={{fontSize:15,color:"var(--muted)",lineHeight:1.8,display:"flex",flexDirection:"column",gap:16}}><p>All Minella Jewels pieces come with a <strong>3-month anti-tarnish warranty</strong>.</p><p>If your jewellery tarnishes within 3 months of purchase under normal use, we will replace it free of charge.</p><p>Warranty does not cover physical damage, breakage, or damage due to improper care (perfume, chemicals, etc.).</p><p>To claim warranty, WhatsApp us with your order details and photos.</p></div>
      </div>
      <Footer />
    </>
  );
}
