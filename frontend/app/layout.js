import "@fontsource/kanit/300.css";
import "@fontsource/kanit/400.css";
import "@fontsource/kanit/600.css";
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Library — ระบบจัดการหนังสือ",
  description: "CRUD หนังสือ + catalog + อัปโหลดปก (Next.js + Express)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <header className="navbar">
          <div className="container nav-inner">
            <Link href="/" className="brand"><span className="brand-logo">📚</span> Library</Link>
            <nav>
              <Link href="/">หนังสือ</Link>
              <Link href="/catalogs">Catalog</Link>
              <Link href="/books/new" className="btn btn-primary">+ เพิ่มหนังสือ</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">Library · Next.js + Express API</footer>
      </body>
    </html>
  );
}
