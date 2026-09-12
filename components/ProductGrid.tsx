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

interface CategoryAssets {
  all: string;
  earring: string;
  necklace: string;
  bracelet: string;
  ring: string;
  anklet: string;
}

interface Props {
  initialProducts: Product[];
  categoryAssets: CategoryAssets;
}

const FALLBACKS: CategoryAssets = {
  all: '/assets/images/categories/necklaces.jpg',
  earring: '/assets/images/categories/earrings.jpg',
  necklace: '/assets/images/categories/necklaces.jpg',
  bracelet: '/assets/images/categories/bracelets.jpg',
  ring: '/assets/images/categories/rings.jpg',
  anklet: '/assets/images/categories/anklets.jpg',
};

export default function ProductGrid({ initialProducts, categoryAssets }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [activeCat, setActiveCat] = useState('all');

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

  function getCatImg(key: string): string {
    const url = categoryAssets[key as keyof CategoryAssets];
    return url || FALLBACKS[key as keyof CategoryAssets] || '';
  }

  return (
    <>
      <div className="cat-bar" id="shopAnchor">
        {CATS.map((c) => (
          <div
            key={c.key}
            className={`cat-circle${activeCat === c.key ? ' active' : ''}`}
            onClick={() => setActiveCat(c.key)}
          >
            <div className="cat-img">
              <img
                src={getCatImg(c.key)}
                alt={c.label}
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
              />
            </div>
            <div className="cat-label">{c.label}</div>
          </div>
        ))}
      </div>

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
