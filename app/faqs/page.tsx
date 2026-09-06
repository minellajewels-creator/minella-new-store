import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = { title: 'FAQs | Minella Jewels' };

export default function Page() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: 'calc(60px + var(--safe-top))', maxWidth: 760, margin: 'calc(60px + var(--safe-top)) auto 60px', padding: '40px 20px' }}>
        <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(1.8rem,4vw,2.5rem)",color:"var(--plum)",marginBottom:24}}>Frequently Asked Questions</h1><div style={{display:"flex",flexDirection:"column",gap:20}}>{[["What is anti-tarnish jewellery?","Anti-tarnish jewellery uses a protective coating that prevents oxidation, keeping it shiny for months even with daily wear, sweat, and water exposure."],["Is Minella jewellery waterproof?","Yes! All our pieces are 100% waterproof and sweat-resistant. Wear them in rain, while exercising, or in the shower."],["Is it safe for sensitive skin?","Yes. All pieces are nickel-free and hypoallergenic, safe for sensitive skin."],["Is Cash on Delivery available?","Yes. COD is available across India. Free shipping on orders above ₹999."],["What is the delivery time?","Orders are dispatched within 1–2 business days. Delivery takes 2–6 business days via Delhivery."],["What is the return policy?","We offer a 7-day hassle-free return policy. Contact us via WhatsApp or email to initiate a return."]].map(([q,a],i) => (<div key={i} style={{background:"var(--bg2)",borderRadius:12,padding:"16px 20px",border:"1px solid var(--border)"}}><div style={{fontWeight:600,marginBottom:8,fontSize:15}}>{q}</div><div style={{fontSize:14,color:"var(--muted)",lineHeight:1.7}}>{a}</div></div>))}</div>
      </div>
      <Footer />
    </>
  );
}
