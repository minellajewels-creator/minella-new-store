import { MetadataRoute } from 'next';
import { getAdminDb } from '@/lib/firebase-admin';

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'https://minella.in';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticUrls: MetadataRoute.Sitemap = [
    { url: STORE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${STORE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${STORE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${STORE_URL}/track`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${STORE_URL}/faqs`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${STORE_URL}/ring-size-guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${STORE_URL}/jewellery-care`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${STORE_URL}/shipping-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${STORE_URL}/return-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${STORE_URL}/privacy-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${STORE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
  try {
    const db = getAdminDb();
    const snap = await db.collection('products').get();
    const productUrls: MetadataRoute.Sitemap = snap.docs.map((d) => ({
      url: `${STORE_URL}/product/${d.id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
    return [...staticUrls, ...productUrls];
  } catch {
    return staticUrls;
  }
}
