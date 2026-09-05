export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  without_offer: number;
  stocks: number;
  category: string;
  image_link: string;
  additional_images: string;
  video_link: string;
  details: string;
  quote: string;
  logo_link?: string;
}

export function extractDriveId(url: string): string | null {
  if (!url) return null;
  const m =
    url.match(/\/file\/d\/([^\/\?&]+)/) ||
    url.match(/[?&]id=([^&]+)/) ||
    url.match(/\/d\/([^\/\s,]+)/);
  return m ? m[1] : null;
}

export function driveThumb(rawUrl: string, width = 600): string {
  if (!rawUrl?.trim()) return '';
  const id = extractDriveId(rawUrl.trim());
  return id ? `https://lh3.googleusercontent.com/d/${id}=w${width}` : rawUrl.trim();
}

export function getAdditionalImgs(cell: string): string[] {
  if (!cell?.trim()) return [];
  return cell
    .replace(/^"|"$/g, '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
}

export function stockStatus(stock: number): 'out' | 'limited' | 'available' {
  if (stock <= 0) return 'out';
  if (stock <= 3) return 'limited';
  return 'available';
}

export function calcDiscount(price: number, wo: number): number | null {
  if (!wo || wo <= price) return null;
  return Math.round(((wo - price) / wo) * 100);
}

export function getProductCategory(p: Product): string {
  const cat = (p.category || '').trim().toLowerCase();
  if (cat) return cat;
  const t = (p.title || '').toLowerCase();
  if (/earring|stud|hoop|jhumk/i.test(t)) return 'earring';
  if (/necklace|pendant|chain/i.test(t)) return 'necklace';
  if (/bracelet|bangle/i.test(t)) return 'bracelet';
  if (/anklet|payal/i.test(t)) return 'anklet';
  if (/\bring\b/i.test(t)) return 'ring';
  return 'other';
}

export function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    earring: 'Earrings',
    necklace: 'Necklaces',
    bracelet: 'Bracelets',
    anklet: 'Anklets',
    ring: 'Rings',
    other: 'Jewellery',
  };
  return map[cat] || 'Jewellery';
}

export function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
