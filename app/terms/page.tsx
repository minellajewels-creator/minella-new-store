import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = { title: 'Terms & Conditions | Minella Jewels' };

export default function Page() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: 'calc(60px + var(--safe-top))', maxWidth: 760, margin: 'calc(60px + var(--safe-top)) auto 60px', padding: '40px 20px' }}>
        <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(1.8rem,4vw,2.5rem)",color:"var(--plum)",marginBottom:16}}>Terms &amp; Conditions</h1><div style={{fontSize:15,color:"var(--muted)",lineHeight:1.8,display:"flex",flexDirection:"column",gap:16}}><p>By placing an order on minella.in, you agree to our shipping, return, and payment policies.</p><p>All prices are in Indian Rupees (₹) and inclusive of taxes.</p><p>We reserve the right to cancel orders in case of stock unavailability or pricing errors.</p><p>Images shown are for reference. Minor colour variations may occur due to photography lighting.</p><p>For disputes, contact us at <a href="mailto:minellajewels@gmail.com" style={{color:"var(--gold)"}}>minellajewels@gmail.com</a>. Jurisdiction: Coimbatore, Tamil Nadu.</p></div>
      </div>
      <Footer />
    </>
  );
}
