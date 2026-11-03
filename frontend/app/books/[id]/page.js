"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getBook, deleteBook, fileUrl } from "@/lib/api";

// หน้า "/books/1" = รายละเอียดหนังสือ (READ ตาม id) + ปุ่มแก้ไข/ลบ
export default function BookDetailPage() {
  const { id } = useParams();     // id จาก URL
  const router = useRouter();
  const [b, setB] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getBook(id).then(setB).catch((e) => setError(e.message)); // ไม่พบ -> backend ตอบ 404 -> ไปตกที่ catch
  }, [id]);

  // ลบแล้วกลับหน้าแรก
  const handleDelete = async () => {
    if (!confirm(`ต้องการลบ "${b.title}" ใช่หรือไม่?`)) return;
    await deleteBook(b.id);
    router.push("/");
  };

  if (error) return <div className="panel"><div className="alert alert-error">{error}</div><Link href="/" className="btn btn-outline">← กลับหน้าแรก</Link></div>;
  if (!b) return <div className="panel">กำลังโหลด...</div>;

  return (
    <div className="panel">
      <Link href="/" className="meta">← กลับไปหน้าหนังสือ</Link>
      <div className="detail" style={{ marginTop: 16 }}>
        <div className="detail-img">{b.cover ? <img src={fileUrl(b.cover)} alt={b.title} /> : null}</div>
        <div>
          <span className="badge">{b.catalogName}</span>
          <h1>{b.title}</h1>
          <p className="meta">โดย {b.author}</p>
          <div className="price" style={{ fontSize: 32 }}>฿{b.price.toLocaleString()}</div>
          <p className={`stock ${b.stock < 5 ? "low" : ""}`}>คงเหลือ {b.stock} เล่ม</p>
          <p style={{ lineHeight: 1.8 }}>{b.description || "— ไม่มีรายละเอียด —"}</p>
          <p className="meta">รหัส #{b.id} · เพิ่มเมื่อ {new Date(b.createdAt).toLocaleString("th-TH")}</p>
          {b.cover && <p className="meta">ไฟล์ปก: <a href={fileUrl(b.cover)} target="_blank" style={{ color: "var(--primary)" }}>{b.cover}</a></p>}
          <div className="form-actions">
            <Link href={`/books/${b.id}/edit`} className="btn btn-primary">✏️ แก้ไข</Link>
            <button className="btn btn-danger" onClick={handleDelete}>🗑️ ลบหนังสือ</button>
          </div>
        </div>
      </div>
    </div>
  );
}
