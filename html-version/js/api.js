// =====================================================================
//  api.js — ฟังก์ชันกลางที่ทุกหน้าใช้ร่วมกัน (โหลดก่อนไฟล์อื่นเสมอ)
//  สคริปต์แบบธรรมดา ไม่มี import/export: ประกาศตัวแปร/ฟังก์ชันไว้ที่นี่
//  แล้วไฟล์อื่นเรียกใช้ได้เลย เพราะอยู่ใน scope เดียวกัน (window)
// =====================================================================

// ที่อยู่ของ backend (ถ้า backend ใช้ port อื่น แก้ที่นี่ที่เดียว)
const API_URL = "http://localhost:4000";

// แปลง path ปก "/uploads/xxx.jpg" ให้เป็น URL เต็ม ใช้ใส่ <img src>
const fileUrl = (p) => (p ? API_URL + p : "");

// ฟังก์ชันกลางยิง API: ได้ JSON กลับมา / ถ้า status ไม่ใช่ 2xx ให้ throw ข้อความจาก backend
async function request(path, options = {}) {
  const res = await fetch(API_URL + path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
  return data;
}

// ส่งข้อมูลแบบ JSON (ใช้กับ catalogs)
const sendJson = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// ---------- catalogs ----------
const getCatalogs   = () => request("/api/catalogs");
const createCatalog = (body) => request("/api/catalogs", sendJson("POST", body));
const updateCatalog = (id, body) => request("/api/catalogs/" + id, sendJson("PUT", body));
const deleteCatalog = (id) => request("/api/catalogs/" + id, { method: "DELETE" });

// ---------- books ----------
// ส่ง FormData เพราะมีไฟล์ — ห้ามตั้ง Content-Type เอง browser ใส่ให้
const getBooks = (q = "", catalogId = "") =>
  request("/api/books?q=" + encodeURIComponent(q) + "&catalogId=" + encodeURIComponent(catalogId));
const getBook    = (id) => request("/api/books/" + id);
const createBook = (formData) => request("/api/books", { method: "POST", body: formData });
const updateBook = (id, formData) => request("/api/books/" + id, { method: "PUT", body: formData });
const deleteBook = (id) => request("/api/books/" + id, { method: "DELETE" });

// ---------- ตัวช่วยเล็กๆ ที่ใช้หลายหน้า ----------
// กัน XSS: แปลงตัวอักษรพิเศษก่อนเอาข้อความไปแทรกใน innerHTML
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// โชว์/ซ่อนกล่องข้อความ error (มี <div id="error"> ในหน้า)
function showError(msg) {
  const box = document.getElementById("error");
  box.textContent = msg;
  box.style.display = msg ? "block" : "none";
}
