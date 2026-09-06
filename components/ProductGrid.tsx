'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, getProductCategory } from '@/lib/products';
import ProductCard from './ProductCard';

const CATS = [
  { key: 'all', label: 'All' },
  { key: 'necklace', label: 'Necklaces' },
  { key: 'bracelet', label: 'Bracelets' },
  { key: 'anklet', label: 'Anklets' },
  { key: 'earring', label: 'Earrings' },
  { key: 'ring', label: 'Rings' },
];

interface Props { initialProducts: Product[] }

export default function ProductGrid({ initialProducts }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [activeCat, setActiveCat] = useState('all');

  // Realtime stock updates from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      const live: Product[] = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Product))
        .filter((p) => p.title);
      if (live.length > 0) setProducts(live);
    });
    return unsub;
  }, []);

  const visible = activeCat === 'all'
    ? products
    : products.filter((p) => getProductCategory(p) === activeCat);

  return (
    <>
      {/* Category bar */}
      <div className="cat-bar" id="shopAnchor">
        {CATS.map((c) => (
          <div
            key={c.key}
            className={`cat-circle${activeCat === c.key ? ' active' : ''}`}
            onClick={() => setActiveCat(c.key)}
          >
            <div className="cat-img">
              <img
                src={`/assets/images/categories/${c.key === 'all' ? 'necklaces' : c.key + 's'}.jpg`}
                alt={c.label}
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
              />
            </div>
            <div className="cat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid-wrap">
        <div className="grid">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </>
  );
}
