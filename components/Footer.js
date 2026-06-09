import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-links">
        <Link href="/impressum" className="footer-link">Impressum</Link>
        <span className="footer-separator">|</span>
        <Link href="/datenschutz" className="footer-link">Datenschutzerklärung</Link>
      </div>
    </footer>
  );
}
