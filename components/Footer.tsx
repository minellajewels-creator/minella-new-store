import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-col brand-col">
          <h3>Minella Jewels</h3>
          <p>Everyday elegance with anti-tarnish, water-resistant jewelry designed for the modern woman.</p>
          <div className="social-links">
            <a href="https://instagram.com/minellajewels" target="_blank" rel="noopener">@minellajewels</a>
            <a href="mailto:minellajewels@gmail.com">minellajewels@gmail.com</a>
            <a href="https://wa.me/919080014835" target="_blank" rel="noopener">+91 90800 14835</a>
          </div>
        </div>
        <div className="footer-col">
          <h4>Quick Links</h4>
          <div className="col-links">
            <Link href="/about">About Us</Link>
            <Link href="/contact">Contact Us</Link>
            <Link href="/track">Track Order</Link>
            <Link href="/faqs">FAQ&apos;s</Link>
            <Link href="/ring-size-guide">Ring Size Guide</Link>
            <Link href="/jewellery-care">Jewellery Care</Link>
          </div>
        </div>
        <div className="footer-col">
          <h4>Company Policies</h4>
          <div className="col-links">
            <Link href="/shipping-policy">Shipping &amp; Delivery</Link>
            <Link href="/return-policy">Refund &amp; Exchange</Link>
            <Link href="/warranty-policy">Warranty</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        &copy; 2026 Minella Jewels &middot; Made with ♥ in Coimbatore
      </div>
    </footer>
  );
}
