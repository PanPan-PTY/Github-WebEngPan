"use client";
import { useEffect, useState } from "react";
import { getCatalogs, createCatalog, updateCatalog, deleteCatalog } from "@/lib/api";

// หน้าเดียวทำครบ CRUD ของ catalog: ฟอร์มด้านบน + ตารางด้านล่าง
export default function CatalogsPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editId, setEditId] = useState(null); // null = โหมดเพิ่ม
  const [error, setError] = useState("");

  const load = () => getCatalogs().then(setRows).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const reset = () => { setForm({ name: "", description: "" }); setEditId(null); };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editId) await updateCatalog(editId, form);
      else await createCatalog(form);
      reset();
      load();
    } catch (err) { setError(err.message); }
  };

  const onEdit = (c) => { setEditId(c.id); setForm({ name: c.name, description: c.description || "" }); };

  const onDelete = async (c) => {
    if (!confirm(`ต้องการลบ catalog "${c.name}" ใช่หรือไม่?`)) return;
    setError("");
    try { await deleteCatalog(c.id); load(); } catch (err) { setError(err.message); } // 409 ถ้ายังมีหนังสือ
  };

  return (
    <div className="panel">
      <h1>จัดการ Catalog</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <form className="inline-form" onSubmit={onSubmit}>
        <input className="input" placeholder="ชื่อ catalog *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="คำอธิบาย" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="btn btn-primary">{editId ? "บันทึกการแก้ไข" : "+ เพิ่ม catalog"}</button>
        {editId && <button type="button" className="btn btn-outline" onClick={reset}>ยกเลิก</button>}
      </form>

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
