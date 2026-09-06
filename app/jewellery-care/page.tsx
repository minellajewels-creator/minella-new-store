import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = { title: 'Jewellery Care | Minella Jewels' };

export default function Page() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: 'calc(60px + var(--safe-top))', maxWidth: 760, margin: 'calc(60px + var(--safe-top)) auto 60px', padding: '40px 20px' }}>
        <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(1.8rem,4vw,2.5rem)",color:"var(--plum)",marginBottom:16}}>Jewellery Care Guide</h1><p style={{fontSize:15,color:"var(--muted)",lineHeight:1.8,marginBottom:24}}>Our anti-tarnish jewellery is built to last, but a little care goes a long way.</p><div style={{display:"flex",flexDirection:"column",gap:16}}>{[["✅ Do","Wipe with a soft dry cloth after wearing","Store in the pouch provided","Wear it daily — it is made for it!"],["❌ Avoid","Direct contact with perfume, lotion, or chemicals","Harsh cleaning agents or ultrasonic cleaners","Leaving it in humid, open storage"]].map(([heading,...items],i)=>(<div key={i} style={{background:"var(--bg2)",borderRadius:12,padding:"16px 20px",border:"1px solid var(--border)"}}><div style={{fontWeight:600,marginBottom:10,fontSize:15,color:i===0?"var(--ok)":"#c0392b"}}>{heading}</div><ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:8}}>{items.map((it,j)=>(<li key={j} style={{fontSize:14,color:"var(--muted)",paddingLeft:16,position:"relative"}}><span style={{position:"absolute",left:0}}>{i===0?"✓":"×"}</span>{it}</li>))}</ul></div>))}</div>
      </div>
      <Footer />
    </>
  );
}
