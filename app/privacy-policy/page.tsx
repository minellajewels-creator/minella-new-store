import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = { title: 'Privacy Policy | Minella Jewels' };

export default function Page() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: 'calc(60px + var(--safe-top))', maxWidth: 760, margin: 'calc(60px + var(--safe-top)) auto 60px', padding: '40px 20px' }}>
        <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(1.8rem,4vw,2.5rem)",color:"var(--plum)",marginBottom:16}}>Privacy Policy</h1><div style={{fontSize:15,color:"var(--muted)",lineHeight:1.8,display:"flex",flexDirection:"column",gap:16}}><p>We collect your name, phone, email, and address only to process and deliver your orders.</p><p>We do not sell or share your personal data with third parties except delivery partners (Delhivery) and payment processors (PayU) as necessary to fulfill your order.</p><p>Payment processing is handled securely by PayU. We do not store card or UPI details.</p><p>For questions, email <a href="mailto:minellajewels@gmail.com" style={{color:"var(--gold)"}}>minellajewels@gmail.com</a>.</p></div>
      </div>
      <Footer />
    </>
  );
}
