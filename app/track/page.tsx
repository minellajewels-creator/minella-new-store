import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = { title: 'Track My Order | Minella Jewels' };

export default function Page() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: 'calc(60px + var(--safe-top))', maxWidth: 760, margin: 'calc(60px + var(--safe-top)) auto 60px', padding: '40px 20px' }}>
        <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(1.8rem,4vw,2.5rem)",color:"var(--plum)",marginBottom:16}}>Track My Order</h1><p style={{fontSize:15,color:"var(--muted)",lineHeight:1.8,marginBottom:24}}>All orders are shipped via <strong>Delhivery</strong>. Once dispatched, you will receive a tracking link via SMS or email.</p><p style={{fontSize:15,color:"var(--muted)",lineHeight:1.8,marginBottom:24}}>To track manually, visit <a href="https://www.delhivery.com/track/" target="_blank" rel="noopener" style={{color:"var(--gold)"}}>delhivery.com/track</a> and enter your AWB number.</p><p style={{fontSize:15,color:"var(--muted)",lineHeight:1.8}}>Need help? WhatsApp us at <a href="https://wa.me/919080014835" style={{color:"var(--gold)"}}>+91 90800 14835</a>.</p>
      </div>
      <Footer />
    </>
  );
}
