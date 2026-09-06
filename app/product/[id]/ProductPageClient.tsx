'use client';
import { useState, useEffect, useRef } from 'react';
import { Product, stockStatus } from '@/lib/products';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCart } from '@/lib/cart';
import { showToast } from '@/components/Toast';
import ProductCard from '@/components/ProductCard';

const FAKE_REVIEWS = [
  { name: 'Priya Krishnan', rating: 5, text: "Absolutely love this piece! Hasn't tarnished even after a month of daily wear. Delivery was super fast too!", date: '2026-03-15' },
  { name: 'Ananya M.', rating: 5, text: 'Ordered for my sister\'s birthday and she was thrilled. Quality is way better than the price suggests.', date: '2026-03-08' },
  { name: 'Kavya R.', rating: 4, text: 'Really nice jewellery. Wore it to a function and got so many compliments. Anti-tarnish coating works!', date: '2026-02-28' },
  { name: 'Deepika S.', rating: 5, text: 'Packaging was gorgeous and piece looks exactly like the photos. COD option made it easy to try.', date: '2026-02-20' },
  { name: 'Meenakshi V.', rating: 4, text: '3 weeks and still shiny. Shipping via Delhivery was prompt.', date: '2026-02-10' },
];

interface Props {
  product: Product;
  allImgs: string[];
  videoSrc: string;
  status: 'out' | 'limited' | 'available';
  discount: number | null;
  related: Product[];
}

function stars(n: number) { return '★'.repeat(n) + '☆'.repeat(5 - n); }
function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

export default function ProductPageClient({ product: initP, allImgs, videoSrc, status: initStatus, discount, related }: Props) {
  const [p, setP] = useState(initP);
  const [status, setStatus] = useState(initStatus);
  const [slide, setSlide] = useState(0);
  const [rvOpen, setRvOpen] = useState(false);
  const [rvRating, setRvRating] = useState(0);
  const [rvName, setRvName] = useState('');
  const [rvText, setRvText] = useState('');
  const [accOpen, setAccOpen] = useState<string>('det');
  const [stickyShow, setStickyShow] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const add = useCart((s) => s.add);

  const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || '';

  const slides = [
    ...allImgs.map((src) => ({ type: 'img' as const, src })),
    ...(videoSrc ? [{ type: 'vid' as const, src: videoSrc }] : []),
  ];

  // Live stock updates
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'products', p.id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setP((prev) => ({ ...prev, stocks: data.stocks ?? prev.stocks }));
        setStatus(stockStatus(data.stocks ?? 0));
      }
    });
    return unsub;
  }, [p.id]);

  // Sticky bar observer
  useEffect(() => {
    if (!addBtnRef.current || window.innerWidth > 640) return;
    const io = new IntersectionObserver(([e]) => setStickyShow(!e.isIntersecting), { threshold: 0 });
    io.observe(addBtnRef.current);
    return () => io.disconnect();
  }, []);

  function handleAdd() {
    const err = add({ id: p.id, title: p.title, price: p.price, stock: p.stocks });
    if (err) showToast(err);
    else showToast('Added to bag ✓');
  }

  function handleShare() {
    if (navigator.share) navigator.share({ title: p.title, url: window.location.href }).catch(() => {});
    else navigator.clipboard.writeText(window.location.href).then(() => showToast('Link copied! 🔗'));
  }

  async function submitReview() {
    if (!rvName.trim()) { showToast('Please enter your name'); return; }
    if (!rvRating) { showToast('Please select a rating'); return; }
    if (!rvText.trim()) { showToast('Please write your review'); return; }
    await fetch(`${GAS_URL}?${new URLSearchParams({ action: 'submitReview', productId: p.id, name: rvName, rating: String(rvRating), review: rvText, date: new Date().toISOString() })}`).catch(() => {});
    setRvOpen(false); setRvName(''); setRvText(''); setRvRating(0);
    showToast('Thanks for your review! ✨');
  }

  const detailItems = p.details ? p.details.split(',').map((d) => d.trim()).filter(Boolean) : [];

  return (
    <>
      <div className="pw">
        {/* Image column */}
        <div className="pp-img-col">
          <div className="stage" style={{ overflow: 'hidden', position: 'relative' }}>
            {slides.length === 0 ? (
              <div style={{ width: '100%', height: '100%', background: 'var(--bg2)' }} />
            ) : slides[slide].type === 'img' ? (
              <img src={slides[slide].src} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s' }} />
            ) : (
              <video src={slides[slide].src} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#111' }} />
            )}
            {slides.length > 1 && (
              <>
                <button className="pp-arr prev" onClick={() => setSlide((s) => (s - 1 + slides.length) % slides.length)}>‹</button>
                <button className="pp-arr next" onClick={() => setSlide((s) => (s + 1) % slides.length)}>›</button>
              </>
            )}
          </div>
          {slides.length > 1 && (
            <div className="thumbs-row">
              {slides.map((sl, i) =>
                sl.type === 'img' ? (
                  <img key={i} src={sl.src} className={`pthumb${slide === i ? ' active' : ''}`} alt={`view ${i + 1}`} onClick={() => setSlide(i)} loading="lazy" />
                ) : (
                  <div key={i} className={`pthumb pthumb-vid${slide === i ? ' active' : ''}`} onClick={() => setSlide(i)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222', borderRadius: 8, cursor: 'pointer' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Info column */}
        <div className="pp-info-col">
          <a href="/" className="back-link">← Back to Store</a>
          <h1 className="pp-title">{p.title}</h1>

          <div className="pp-price-row">
            <span className="pp-price">₹{p.price.toLocaleString('en-IN')}</span>
            {discount && discount > 0 && (
              <>
                <span className="pp-was">₹{p.without_offer.toLocaleString('en-IN')}</span>
                <span className="pp-disc">{discount}% off</span>
              </>
            )}
          </div>

          <div className={`pstock ${status}`}>
            {status === 'out' ? 'Out of Stock' : status === 'limited' ? `⚠ Only ${p.stocks} left!` : '✓ In Stock'}
          </div>

          <div className="pp-cod-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Cash on Delivery available
          </div>

          <div className="pp-trust">
            {[['Anti-tarnish','M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],['100% Waterproof','M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2m0 4a6 6 0 0 0-6 6 6 6 0 0 0 6 6 6 6 0 0 0 6-6 6 6 0 0 0-6-6z'],['Fast delivery','M1 3h15v13H1zM16 8h4l3 3v5h-7V8z M5.5 16a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm13 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z'],['Secure pay','M3 11h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V11zM7 11V7a5 5 0 0 1 10 0v4']].map(([label, d]) => (
              <span key={label}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={d}/></svg>{label}</span>
            ))}
          </div>

          <button ref={addBtnRef} className="btn-atb" disabled={status === 'out'} onClick={handleAdd}>
            {status === 'out' ? 'Out of Stock' : 'Add to Bag'}
          </button>

          <div className="pp-actions-row">
            <button className="btn-share" onClick={handleShare}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Share
            </button>
          </div>

          {/* Accordions */}
          {detailItems.length > 0 && <Acc key="det" id="det" label="Product Details" open={accOpen === 'det'} onToggle={(id) => setAccOpen(accOpen === id ? '' : id)}>
            <ul className="acc-bullets">{detailItems.map((d, i) => <li key={i}>{d}</li>)}</ul>
          </Acc>}
          {p.description && <Acc id="desc" label="Description" open={accOpen === 'desc'} onToggle={(id) => setAccOpen(accOpen === id ? '' : id)}>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>{p.description}</p>
          </Acc>}
          <Acc id="ship" label="Shipping Policy" open={accOpen === 'ship'} onToggle={(id) => setAccOpen(accOpen === id ? '' : id)}>
            <ul className="acc-bullets">
              <li>Shipped via <strong>Delhivery</strong> — reliable pan-India delivery</li>
              <li>Delivery in <strong>2–6 business days</strong> after dispatch</li>
              <li><strong>Free shipping</strong> on orders above ₹999</li>
              <li><strong>Cash on Delivery</strong> available across India</li>
              <li>Tracking link via SMS/email once shipped</li>
            </ul>
          </Acc>
          <Acc id="why" label="Why Choose Us" open={accOpen === 'why'} onToggle={(id) => setAccOpen(accOpen === id ? '' : id)}>
            <div className="acc-why">
              {[['💧','100% Waterproof','Wear it in rain, sweat or shower'],['✨','Anti-Tarnish','Stays shiny for months — guaranteed'],['🤝','Skin-Safe','Nickel-free, hypoallergenic'],['📦','Fast Delivery','Dispatched within 24 hrs'],['🔄','Easy Returns','Hassle-free within 7 days'],['🔒','Secure Payments','PayU — cards, UPI, COD']].map(([icon, title, sub]) => (
                <div key={title} className="acc-why-item"><div className="acc-why-icon">{icon}</div><div className="acc-why-text"><strong>{title}</strong><span>{sub}</span></div></div>
              ))}
            </div>
          </Acc>
          <Acc id="care" label="Size & Care" open={accOpen === 'care'} onToggle={(id) => setAccOpen(accOpen === id ? '' : id)}>
            <ul className="acc-bullets">
              <li>Adjustable size fits everyone</li>
              <li>Avoid direct contact with perfume, lotion or chemicals</li>
            </ul>
          </Acc>

          {/* Reviews */}
          <div className="rv-section">
            <div className="rv-head">
              <div><div className="rv-title">Customer Reviews</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div className="rv-avg">
                  <div className="rv-avg-num">4.8</div>
                  <div><div className="rv-stars">★★★★★</div><div className="rv-count">5 reviews</div></div>
                </div>
                <button className="btn-write-rv" onClick={() => setRvOpen(true)}>Write a Review</button>
              </div>
            </div>
            <div className="rv-list">
              {FAKE_REVIEWS.map((r, i) => (
                <div key={i} className="rv-card">
                  <div className="rv-card-head"><span className="rv-name">{r.name}</span><span className="rv-date">{fmtDate(r.date)}</span></div>
                  <div className="rv-card-stars">{stars(r.rating)}</div>
                  <div className="rv-text">{r.text}</div>
                  <div className="rv-verified">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Verified Purchase
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* YMAL */}
      {related.length > 0 && (
        <div className="ymal-section">
          <div className="ymal-title">You May Also Like</div>
          <div className="ymal-strip">
            {related.map((rp) => <ProductCard key={rp.id} product={rp} />)}
          </div>
        </div>
      )}

      {/* Sticky ATB (mobile) */}
      <div className={`sticky-atb${stickyShow ? ' show' : ''}`}>
        <div className="sticky-atb-info">
          <div className="sticky-atb-title">{p.title}</div>
          <div className="sticky-atb-price">₹{p.price.toLocaleString('en-IN')}</div>
        </div>
        <button className="sticky-atb-btn" disabled={status === 'out'} onClick={handleAdd}>
          {status === 'out' ? 'Out of Stock' : 'Add to Bag'}
        </button>
      </div>

      {/* Review modal */}
      {rvOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,44,44,.5)', zIndex: 1300 }} onClick={() => setRvOpen(false)} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 1301, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: 'var(--bg)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 440, boxShadow: '0 8px 40px rgba(0,0,0,.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.1rem', fontWeight: 600 }}>Write a Review</span>
                <button className="btn-close" onClick={() => setRvOpen(false)}>✕</button>
              </div>
              <div className="form-g">
                <label className="form-label">Your Name</label>
                <input className="form-input" placeholder="e.g. Priya S." value={rvName} onChange={(e) => setRvName(e.target.value)} />
              </div>
              <div className="form-g">
                <label className="form-label">Rating</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1,2,3,4,5].map((v) => (
                    <span key={v} onClick={() => setRvRating(v)} style={{ fontSize: '1.8rem', cursor: 'pointer', color: v <= rvRating ? 'var(--gold)' : 'var(--border)' }}>★</span>
                  ))}
                </div>
              </div>
              <div className="form-g">
                <label className="form-label">Your Review</label>
                <textarea className="form-input" placeholder="Tell us what you think…" rows={4} value={rvText} onChange={(e) => setRvText(e.target.value)} style={{ resize: 'vertical' }} />
              </div>
              <button className="btn-atb" onClick={submitReview}>Submit Review</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Acc({ id, label, open, onToggle, children }: { id: string; label: string; open: boolean; onToggle: (id: string) => void; children: React.ReactNode }) {
  return (
    <div className="acc">
      <button className={`acc-head${open ? ' open' : ''}`} onClick={() => onToggle(id)}>
        {label}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div className={`acc-body${open ? ' open' : ''}`}>{children}</div>
    </div>
  );
}
