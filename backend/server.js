// Library API — Express + Multer, 2 ตาราง: catalogs (1) ---- (N) books
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, "data.json");
const UPLOAD_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ catalogs: [], books: [] }));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(UPLOAD_DIR));

// ---------- helper อ่าน/เขียนข้อมูล (db = { catalogs, books }) ----------
const readDb = () => JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
const writeDb = (db) => fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
const nextId = (rows) => (rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1);
const removeFile = (url) => {
  if (!url) return;
  const p = path.join(UPLOAD_DIR, path.basename(url));
  if (fs.existsSync(p)) fs.unlinkSync(p);
};
// แนบชื่อ catalog เข้าไปกับหนังสือ (เหมือน JOIN)
const withCatalog = (book, catalogs) => ({
  ...book,
  catalogName: catalogs.find((c) => c.id === book.catalogId)?.name ?? null,
});

// ---------- ตั้งค่าอัปโหลดปก ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e6) + path.extname(file.originalname)),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    /^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)
      ? cb(null, true)
      : cb(new Error("อนุญาตเฉพาะไฟล์รูปภาพ (jpg, png, gif, webp)")),
});

app.get("/", (req, res) => res.json({ message: "Library API is running" }));

// =====================  CATALOGS  =====================
app.get("/api/catalogs", (req, res) => {
  const { books, catalogs } = readDb();
  res.json(catalogs.map((c) => ({ ...c, bookCount: books.filter((b) => b.catalogId === c.id).length })));
});

app.get("/api/catalogs/:id", (req, res) => {
  const item = readDb().catalogs.find((c) => c.id === Number(req.params.id));
  if (!item) return res.status(404).json({ message: "ไม่พบ catalog" });
  res.json(item);
});

app.post("/api/catalogs", (req, res) => {
  const { name, description = "" } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: "กรุณากรอกชื่อ catalog" });
  const db = readDb();
  if (db.catalogs.some((c) => c.name === name.trim()))
    return res.status(409).json({ message: "ชื่อ catalog ซ้ำ" });
  const item = { id: nextId(db.catalogs), name: name.trim(), description };
  db.catalogs.push(item);
  writeDb(db);
  res.status(201).json(item);
});

app.put("/api/catalogs/:id", (req, res) => {
  const db = readDb();
  const idx = db.catalogs.findIndex((c) => c.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ message: "ไม่พบ catalog" });
  if (!req.body.name || !req.body.name.trim()) return res.status(400).json({ message: "กรุณากรอกชื่อ catalog" });
  db.catalogs[idx] = { ...db.catalogs[idx], name: req.body.name.trim(), description: req.body.description ?? db.catalogs[idx].description };
  writeDb(db);
  res.json(db.catalogs[idx]);
});

// ลบไม่ได้ถ้ายังมีหนังสืออยู่ใน catalog (409 Conflict)
app.delete("/api/catalogs/:id", (req, res) => {
  const db = readDb();
  const id = Number(req.params.id);
  if (!db.catalogs.some((c) => c.id === id)) return res.status(404).json({ message: "ไม่พบ catalog" });
  if (db.books.some((b) => b.catalogId === id))
    return res.status(409).json({ message: "ลบไม่ได้ เพราะยังมีหนังสืออยู่ใน catalog นี้" });
  db.catalogs = db.catalogs.filter((c) => c.id !== id);
  writeDb(db);
  res.json({ message: "ลบ catalog เรียบร้อย", id });
});

// =====================  BOOKS  =====================
// ?q= ค้นหาชื่อ/ผู้แต่ง  ?catalogId= กรองตาม catalog
app.get("/api/books", (req, res) => {
  const { q = "", catalogId = "" } = req.query;
  const { books, catalogs } = readDb();
  let rows = books;
  if (q) rows = rows.filter((b) => (b.title + " " + b.author).toLowerCase().includes(q.toLowerCase()));
  if (catalogId) rows = rows.filter((b) => b.catalogId === Number(catalogId));
  res.json(rows.map((b) => withCatalog(b, catalogs)).sort((a, b) => b.id - a.id));
});

app.get("/api/books/:id", (req, res) => {
  const { books, catalogs } = readDb();
  const item = books.find((b) => b.id === Number(req.params.id));
  if (!item) return res.status(404).json({ message: "ไม่พบหนังสือ" });
  res.json(withCatalog(item, catalogs));
});

// ตรวจข้อมูลหนังสือ (ใช้ทั้ง POST และ PUT)
const validateBook = (body, catalogs) => {
  if (!body.title || !body.title.trim()) return "กรุณากรอกชื่อหนังสือ";
  if (!body.author || !body.author.trim()) return "กรุณากรอกชื่อผู้แต่ง";
  if (body.price === undefined || body.price === "" || Number(body.price) < 0) return "ราคาไม่ถูกต้อง";
  if (!catalogs.some((c) => c.id === Number(body.catalogId))) return "ไม่พบ catalog ที่เลือก";
  return null;
};
const toBook = (body, old = {}) => ({
  ...old,
  title: body.title.trim(),
  author: body.author.trim(),
  price: Number(body.price),
  stock: Number(body.stock || 0),
  catalogId: Number(body.catalogId),
  description: body.description ?? "",
});

app.post("/api/books", upload.single("cover"), (req, res) => {
  const db = readDb();
  const err = validateBook(req.body, db.catalogs);
  if (err) {
    if (req.file) removeFile(req.file.filename); // ลบไฟล์ที่เพิ่งอัปโหลดถ้าข้อมูลไม่ผ่าน
    return res.status(400).json({ message: err });
  }
  const item = {
    id: nextId(db.books),
    ...toBook(req.body),
    cover: req.file ? `/uploads/${req.file.filename}` : null,
    createdAt: new Date().toISOString(),
  };
  db.books.push(item);
  writeDb(db);
  res.status(201).json(withCatalog(item, db.catalogs));
});

app.put("/api/books/:id", upload.single("cover"), (req, res) => {
  const db = readDb();
  const idx = db.books.findIndex((b) => b.id === Number(req.params.id));
  if (idx === -1) {
    if (req.file) removeFile(req.file.filename);
    return res.status(404).json({ message: "ไม่พบหนังสือ" });
  }
  const err = validateBook(req.body, db.catalogs);
  if (err) {
    if (req.file) removeFile(req.file.filename);
    return res.status(400).json({ message: err });
  }
  const updated = toBook(req.body, db.books[idx]);
  if (req.file) {
    removeFile(db.books[idx].cover);
    updated.cover = `/uploads/${req.file.filename}`;
  }
  updated.updatedAt = new Date().toISOString();
  db.books[idx] = updated;
  writeDb(db);
  res.json(withCatalog(updated, db.catalogs));
});

app.delete("/api/books/:id", (req, res) => {
  const db = readDb();
  const item = db.books.find((b) => b.id === Number(req.params.id));
  if (!item) return res.status(404).json({ message: "ไม่พบหนังสือ" });
  removeFile(item.cover);
  db.books = db.books.filter((b) => b.id !== item.id);
  writeDb(db);
  res.json({ message: "ลบหนังสือเรียบร้อย", id: item.id });
});

// จัดการ error (ไฟล์ผิดประเภท / ใหญ่เกิน)
app.use((err, req, res, next) => res.status(400).json({ message: err.message }));

app.listen(PORT, () => console.log(`Library API -> http://localhost:${PORT}`));
