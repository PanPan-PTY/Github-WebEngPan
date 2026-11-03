"use client";
import { useEffect, useState } from "react";
import { getCatalogs, createCatalog, updateCatalog, deleteCatalog } from "@/lib/api";

// หน้า "/catalogs" = CRUD ของตารางแม่ ครบในหน้าเดียว
//   ฟอร์มด้านบน (ใช้ทั้งเพิ่มและแก้) + ตารางรายการด้านล่าง
export default function CatalogsPage() {
  const [rows, setRows] = useState([]);                       // รายการ catalog
  const [form, setForm] = useState({ name: "", description: "" }); // ค่าในฟอร์ม
  const [editId, setEditId] = useState(null); // null = โหมดเพิ่ม, มีเลข = กำลังแก้ catalog นั้น
  const [error, setError] = useState("");

  const load = () => getCatalogs().then(setRows).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []); // โหลดตอนเปิดหน้า

  // ล้างฟอร์ม กลับเป็นโหมดเพิ่ม
  const reset = () => { setForm({ name: "", description: "" }); setEditId(null); };

  // กดบันทึก: ถ้ามี editId -> PUT (แก้) ไม่งั้น -> POST (เพิ่ม)
  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editId) await updateCatalog(editId, form);
      else await createCatalog(form);
      reset();
      load(); // โหลดตารางใหม่
    } catch (err) { setError(err.message); }
  };

  // กดปุ่ม "แก้ไข" ในแถว: เอาค่าของแถวนั้นมาใส่ฟอร์ม + จำ id ไว้
  const onEdit = (c) => { setEditId(c.id); setForm({ name: c.name, description: c.description || "" }); };

  // ลบ: ถ้ายังมีหนังสือใน catalog นี้ backend ตอบ 409 -> โชว์ข้อความ error ให้ผู้ใช้เห็น
  const onDelete = async (c) => {
    if (!confirm(`ต้องการลบ catalog "${c.name}" ใช่หรือไม่?`)) return;
    setError("");
    try { await deleteCatalog(c.id); load(); } catch (err) { setError(err.message); }
  };

  return (
    <div className="panel">
      <h1>จัดการ Catalog</h1>
      {error && <div className="alert alert-error">{error}</div>}

      {/* ฟอร์มเพิ่ม/แก้ไข */}
      <form className="inline-form" onSubmit={onSubmit}>
        <input className="input" placeholder="ชื่อ catalog *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="คำอธิบาย" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="btn btn-primary">{editId ? "บันทึกการแก้ไข" : "+ เพิ่ม catalog"}</button>
        {editId && <button type="button" className="btn btn-outline" onClick={reset}>ยกเลิก</button>}
      </form>

      {/* ตารางรายการ */}
      <table className="table">
        <thead><tr><th>#</th><th>ชื่อ</th><th>คำอธิบาย</th><th>จำนวนหนังสือ</th><th></th></tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td><td>{c.name}</td><td>{c.description}</td><td>{c.bookCount}</td>
              <td className="row-actions">
                <button className="btn btn-outline" onClick={() => onEdit(c)}>แก้ไข</button>
                <button className="btn btn-danger" onClick={() => onDelete(c)}>ลบ</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={5} className="empty">ยังไม่มี catalog</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
