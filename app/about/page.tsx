import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = { title: 'About Us | Minella Jewels' };

export default function Page() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: 'calc(60px + var(--safe-top))', maxWidth: 760, margin: 'calc(60px + var(--safe-top)) auto 60px', padding: '40px 20px' }}>
        <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(1.8rem,4vw,2.5rem)",color:"var(--plum)",marginBottom:16}}>About Minella Jewels</h1><p style={{fontSize:15,color:"var(--muted)",lineHeight:1.8,marginBottom:16}}>Minella Jewels was born from a simple belief — everyday jewellery should be beautiful, affordable, and built to last. We create anti-tarnish, waterproof pieces designed for the modern Indian woman who wears her jewellery every single day.</p><p style={{fontSize:15,color:"var(--muted)",lineHeight:1.8,marginBottom:16}}>Every piece is crafted with an 18K gold plating and a protective anti-tarnish coating that keeps it shining for months — even through workouts, rain, and daily life. We are proudly made in Coimbatore, Tamil Nadu.</p><p style={{fontSize:15,color:"var(--muted)",lineHeight:1.8}}>Got questions? Reach us at <a href="mailto:minellajewels@gmail.com" style={{color:"var(--gold)"}}>minellajewels@gmail.com</a> or WhatsApp <a href="https://wa.me/919080014835" style={{color:"var(--gold)"}}>+91 90800 14835</a>.</p>
      </div>
      <Footer />
    </>
  );
}
