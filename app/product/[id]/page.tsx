import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getAdminDb } from '@/lib/firebase-admin';
import {
  Product, driveThumb, getAdditionalImgs, extractDriveId,
  stockStatus, calcDiscount, getProductCategory, categoryLabel, esc,
} from '@/lib/products';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import ProductPageClient from './ProductPageClient';

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'https://minella.in';

export const revalidate = 30;

export async function generateStaticParams() {
  try {
    const db = getAdminDb();
    const snap = await db.collection('products').get();
    return snap.docs.map((d) => ({ id: d.id }));
  } catch { return []; }
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const db = getAdminDb();
    const doc = await db.collection('products').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Product;
  } catch { return null; }
}

async function getRelated(category: string, currentId: string): Promise<Product[]> {
  try {
    const db = getAdminDb();
    const snap = await db.collection('products').where('category', '==', category).limit(9).get();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Product))
      .filter((p) => p.id !== currentId)
      .slice(0, 8);
  } catch { return []; }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const p = await getProduct(params.id);
  if (!p) return { title: 'Product Not Found | Minella Jewels' };
  const img = driveThumb(p.image_link, 800);
  return {
    title: `${p.title} | Anti-Tarnish Jewellery | Minella Jewels India`,
    description: p.description || `Buy ${p.title} online — anti-tarnish, waterproof, 18K gold plated. Skin-safe, nickel-free. Cash on delivery across India.`,
    openGraph: {
      title: `${p.title} | Minella Jewels`,
      images: [{ url: img, width: 800, height: 800 }],
      type: 'website',
    },
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const p = await getProduct(params.id);
  if (!p) notFound();

  const category = getProductCategory(p);
  const catLabel = categoryLabel(category);
  const related = await getRelated(category, p.id);

  const mainImg = driveThumb(p.image_link, 800);
  const addlImgs = getAdditionalImgs(p.additional_images).map((u) => driveThumb(u, 800));
  const allImgs = [mainImg, ...addlImgs].filter(Boolean);
  const videoRaw = (p.video_link || '').trim();
  const videoId = videoRaw ? extractDriveId(videoRaw) : null;
  const videoSrc = videoId ? `https://drive.google.com/uc?export=download&id=${videoId}` : videoRaw;

  const status = stockStatus(p.stocks);
  const discount = calcDiscount(p.price, p.without_offer);
  const canonical = `${STORE_URL}/product/${p.id}`;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    description: p.description || `${p.title} — Anti-tarnish, water-resistant jewellery by Minella Jewels.`,
    image: allImgs,
    brand: { '@type': 'Brand', name: 'Minella' },
    sku: p.id,
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: 'INR',
      price: p.price.toFixed(2),
      availability: p.stocks > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'Minella Jewels', url: STORE_URL },
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: STORE_URL },
      { '@type': 'ListItem', position: 2, name: catLabel, item: `${STORE_URL}/?cat=${category}` },
      { '@type': 'ListItem', position: 3, name: p.title, item: canonical },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <Navbar />

      <nav className="breadcrumb" aria-label="breadcrumb">
        <a href="/">Home</a>
        <span className="breadcrumb-sep">›</span>
        <a href={`/?cat=${category}`}>{catLabel}</a>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{p.title}</span>
      </nav>

      <ProductPageClient
        product={p}
        allImgs={allImgs}
        videoSrc={videoSrc}
        status={status}
        discount={discount}
        related={related}
      />

      <a href="https://wa.me/919080014835" target="_blank" rel="noopener" id="waBtn" aria-label="Chat on WhatsApp">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>

      <Toast />
      <Footer />
    </>
  );
}
