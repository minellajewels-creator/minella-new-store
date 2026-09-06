import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = { title: 'Ring Size Guide | Minella Jewels' };

export default function Page() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: 'calc(60px + var(--safe-top))', maxWidth: 760, margin: 'calc(60px + var(--safe-top)) auto 60px', padding: '40px 20px' }}>
        <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(1.8rem,4vw,2.5rem)",color:"var(--plum)",marginBottom:16}}>Ring Size Guide</h1><p style={{fontSize:15,color:"var(--muted)",lineHeight:1.8,marginBottom:24}}>All Minella Jewels rings are adjustable and fit most finger sizes. To measure your size, wrap a thin strip of paper around your finger, mark where it overlaps, and measure the length in mm.</p><table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}><thead><tr style={{background:"var(--gold-lt)"}}><th style={{padding:"10px 16px",textAlign:"left",borderRadius:"8px 0 0 0"}}>Size</th><th style={{padding:"10px 16px",textAlign:"left"}}>Circumference (mm)</th><th style={{padding:"10px 16px",textAlign:"left",borderRadius:"0 8px 0 0"}}>Diameter (mm)</th></tr></thead><tbody>{[["5 (XS)","49","15.7"],["6 (S)","52","16.5"],["7 (M)","54","17.3"],["8 (L)","57","18.2"],["9 (XL)","60","19.0"],["10 (XXL)","63","20.0"]].map(([s,c,d],i)=>(<tr key={i} style={{background:i%2===0?"var(--bg)":"var(--bg2)"}}><td style={{padding:"10px 16px"}}>{s}</td><td style={{padding:"10px 16px"}}>{c}</td><td style={{padding:"10px 16px"}}>{d}</td></tr>))}</tbody></table>
      </div>
      <Footer />
    </>
  );
}
