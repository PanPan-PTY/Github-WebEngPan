"use client"; // ใช้ state/effect จึงต้องเป็น client component
import { useEffect, useState } from "react";
import Link from "next/link";
import { getBooks, getCatalogs, deleteBook, fileUrl } from "@/lib/api";

// หน้าแรก "/" = รายการหนังสือ (READ ทั้งหมด) + ค้นหา + กรองตาม catalog + ปุ่มลบ
export default function HomePage() {
  // ---------- state ----------
  const [books, setBooks] = useState([]);         // รายการหนังสือที่แสดง
  const [catalogs, setCatalogs] = useState([]);   // ไว้ทำ dropdown กรอง
  const [q, setQ] = useState("");                 // คำค้น
  const [catalogId, setCatalogId] = useState(""); // catalog ที่เลือกกรอง ("" = ทั้งหมด)
  const [loading, setLoading] = useState(true);   // กำลังโหลดหรือไม่
  const [error, setError] = useState("");

  // โหลดหนังสือจาก backend ตามคำค้น/ตัวกรองปัจจุบัน
  const load = async () => {
    try {
      setLoading(true);
      setBooks(await getBooks(q, catalogId));
      setError("");
    } catch (e) {
      setError("เชื่อมต่อ API ไม่ได้: " + e.message);
    } finally {
      setLoading(false); // ไม่ว่าสำเร็จหรือพลาดก็เลิกโชว์ "กำลังโหลด"
    }
  };

  // โหลด catalog ครั้งเดียวตอนเปิดหน้า (ไว้ทำ dropdown)
  useEffect(() => { getCatalogs().then(setCatalogs).catch(() => {}); }, []);

  // โหลดหนังสือใหม่ทุกครั้งที่ q หรือ catalogId เปลี่ยน
  // setTimeout 300ms = debounce: รอให้หยุดพิมพ์ก่อนค่อยยิง API ไม่ยิงทุกตัวอักษร
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, catalogId]);

  // ลบ: ถามยืนยัน -> เรียก API -> โหลดรายการใหม่
  const handleDelete = async (b) => {
    if (!confirm(`ต้องการลบ "${b.title}" ใช่หรือไม่?`)) return;
    try { await deleteBook(b.id); load(); } catch (e) { setError(e.message); }
  };

  return (
    <>
      <section className="hero">
        <h1>หนังสือในห้องสมุด</h1>
        <p>เพิ่ม แก้ไข ลบ จัดหมวดตาม catalog และอัปโหลดปกหนังสือ</p>
        <div className="stats">
          <div className="stat"><b>{books.length}</b>เล่ม</div>
          <div className="stat"><b>{catalogs.length}</b>catalog</div>
        </div>
      </section>

      {/* แถบค้นหา + กรอง: พิมพ์/เลือกแล้ว state เปลี่ยน -> useEffect ด้านบนยิง API ใหม่ให้เอง */}
      <div className="toolbar">
        <input className="input" placeholder="🔍 ค้นหาชื่อหนังสือ / ผู้แต่ง..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={catalogId} onChange={(e) => setCatalogId(e.target.value)}>
          <option value="">ทุก catalog</option>
          {catalogs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* แสดงผล 3 แบบ: กำลังโหลด / ไม่มีข้อมูล / มีข้อมูล */}
      {loading ? (
        <div className="empty">กำลังโหลด...</div>
      ) : books.length === 0 ? (
        <div className="empty">ยังไม่มีหนังสือ <Link href="/books/new" style={{ color: "var(--primary)" }}>เพิ่มเล่มแรก</Link></div>
      ) : (
        <div className="grid">
          {/* .map = วนทำการ์ดทีละเล่ม  key ต้องไม่ซ้ำ (ใช้ id) */}
          {books.map((b) => (
            <div className="card" key={b.id}>
              <Link href={`/books/${b.id}`} className="card-img">
                {b.cover ? <img src={fileUrl(b.cover)} alt={b.title} /> : "ไม่มีปก"}
              </Link>
              <div className="card-body">
                <span className="badge">{b.catalogName}</span>
                <Link href={`/books/${b.id}`}><h3 className="card-title">{b.title}</h3></Link>
                <div className="meta">{b.author}</div>
                <div className="price">฿{b.price.toLocaleString()}</div>
                <div className={`stock ${b.stock < 5 ? "low" : ""}`}>คงเหลือ {b.stock} เล่ม</div>
                <div className="card-actions">
                  <Link href={`/books/${b.id}/edit`} className="btn btn-outline">แก้ไข</Link>
                  <button className="btn btn-danger" onClick={() => handleDelete(b)}>ลบ</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
