'use client';
import Link from 'next/link';
import { Product, driveThumb, stockStatus, calcDiscount } from '@/lib/products';
import { useCart } from '@/lib/cart';
import { getProductCategory } from '@/lib/products';
import { showToast } from './Toast';

interface Props { product: Product; }

export default function ProductCard({ product: p }: Props) {
  const add = useCart((s) => s.add);
  const status = stockStatus(p.stocks);
  const isOut = status === 'out';
  const disc = calcDiscount(p.price, p.without_offer);
  const img = driveThumb(p.image_link || p.image_thumb || '', 400);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const err = add({ id: p.id, title: p.title, price: p.price, stock: p.stocks });
    if (err) showToast(err);
    else showToast('Added to bag ✓');
  }

  return (
    <Link href={`/product/${p.id}`} className="product-card" style={{ textDecoration: 'none', display: 'block' }}>
      {isOut && <div className="stock-badge out">Out of Stock</div>}
      {status === 'limited' && !isOut && <div className="stock-badge limited">Few left</div>}
      {disc && disc > 0 && (
        <span style={{
          position: 'absolute', top: 10, right: 10, background: 'var(--gold)',
          padding: '2px 8px', fontSize: 10, borderRadius: 10, color: '#fff', zIndex: 4,
        }}>{disc}% OFF</span>
      )}
      <div className="img-wrap">
        {img ? (
          <img src={img} alt={p.title} loading="lazy" />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--bg2)' }} />
        )}
      </div>
      <div className="card-body">
        <div className="card-title">{p.title}</div>
        <div className="price-row">
          {disc && disc > 0 ? (
            <div className="price-offer">
              <span className="price-now">₹{p.price.toLocaleString('en-IN')}</span>
              <span className="price-original">₹{p.without_offer.toLocaleString('en-IN')}</span>
            </div>
          ) : (
            <div className="price-single">₹{p.price.toLocaleString('en-IN')}</div>
          )}
        </div>
        <div className="card-actions">
          <button className="btn-add" disabled={isOut} onClick={handleAdd}>
            {isOut ? 'Out of Stock' : 'Add to Bag'}
          </button>
        </div>
      </div>
    </Link>
  );
}
