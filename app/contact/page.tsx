import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = { title: 'Contact Us | Minella Jewels' };

export default function Page() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: 'calc(60px + var(--safe-top))', maxWidth: 760, margin: 'calc(60px + var(--safe-top)) auto 60px', padding: '40px 20px' }}>
        <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(1.8rem,4vw,2.5rem)",color:"var(--plum)",marginBottom:16}}>Contact Us</h1><p style={{fontSize:15,color:"var(--muted)",lineHeight:1.8,marginBottom:24}}>We would love to hear from you. Reach us through any of the channels below.</p><div style={{display:"flex",flexDirection:"column",gap:16}}><a href="https://wa.me/919080014835" target="_blank" rel="noopener" style={{display:"flex",alignItems:"center",gap:12,padding:"16px 20px",background:"var(--bg2)",borderRadius:12,border:"1px solid var(--border)",textDecoration:"none",color:"var(--text)",fontWeight:600}}><span style={{fontSize:"1.5rem"}}>💬</span><div><div>WhatsApp</div><div style={{fontSize:13,color:"var(--muted)",fontWeight:400}}>+91 90800 14835</div></div></a><a href="mailto:minellajewels@gmail.com" style={{display:"flex",alignItems:"center",gap:12,padding:"16px 20px",background:"var(--bg2)",borderRadius:12,border:"1px solid var(--border)",textDecoration:"none",color:"var(--text)",fontWeight:600}}><span style={{fontSize:"1.5rem"}}>✉️</span><div><div>Email</div><div style={{fontSize:13,color:"var(--muted)",fontWeight:400}}>minellajewels@gmail.com</div></div></a><a href="https://instagram.com/minellajewels" target="_blank" rel="noopener" style={{display:"flex",alignItems:"center",gap:12,padding:"16px 20px",background:"var(--bg2)",borderRadius:12,border:"1px solid var(--border)",textDecoration:"none",color:"var(--text)",fontWeight:600}}><span style={{fontSize:"1.5rem"}}>📸</span><div><div>Instagram</div><div style={{fontSize:13,color:"var(--muted)",fontWeight:400}}>@minellajewels</div></div></a></div>
      </div>
      <Footer />
    </>
  );
}
