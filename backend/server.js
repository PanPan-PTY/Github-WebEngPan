// =====================================================================
//  Library API  —  Express + Multer
//  ตาราง 2 ตาราง: catalogs (หมวดหมู่)  1 ---- N  books (หนังสือ)
//  อ่านไฟล์นี้จากบนลงล่าง = ลำดับที่ควรเขียนในห้องสอบ
//
//  ถ้าโจทย์เปลี่ยนชื่อ (เช่น books -> products) ให้ใช้ Find & Replace
//  แล้วแก้ field ใน validateBook() กับ toBook() เท่านั้น
// =====================================================================

// ---------- 1) นำเข้า library ----------
const express = require("express"); // ตัวทำ web server / REST API
const cors = require("cors");       // อนุญาตให้ frontend (port 3000) เรียก API (port 4000) ได้
const multer = require("multer");   // ตัวรับไฟล์อัปโหลด (multipart/form-data)
const fs = require("fs");           // อ่าน/เขียนไฟล์ในเครื่อง
const path = require("path");       // จัดการ path ไฟล์

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, "data.json"); // "ฐานข้อมูล" = ไฟล์ JSON
const UPLOAD_DIR = path.join(__dirname, "uploads");  // โฟลเดอร์เก็บรูปปก

// ถ้ายังไม่มีโฟลเดอร์/ไฟล์ ให้สร้างให้เลย กัน error ตอนรันครั้งแรก
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ catalogs: [], books: [] }));

// ---------- 2) middleware (ทำงานก่อนถึง route ทุกตัว) ----------
app.use(cors());                                  // เปิด CORS
app.use(express.json());                          // อ่าน body ที่เป็น JSON  -> req.body
app.use(express.urlencoded({ extended: true }));  // อ่าน body แบบฟอร์มธรรมดา
app.use("/uploads", express.static(UPLOAD_DIR));  // ให้เปิดรูปได้ที่ http://localhost:4000/uploads/ชื่อไฟล์
app.use("/web", express.static(path.join(__dirname, "..", "html-version"))); // เปิดเว็บแบบ HTML ธรรมดาที่ http://localhost:4000/web/

// ---------- 3) ฟังก์ชันช่วย (helper) ----------
// db มีหน้าตาเป็น { catalogs: [...], books: [...] }
const readDb = () => JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); // อ่านข้อมูลทั้งหมด
const writeDb = (db) => fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); // บันทึกกลับ

// สร้าง id ใหม่ = id สูงสุด + 1 (ถ้ายังไม่มีข้อมูลเลยให้เริ่มที่ 1)
const nextId = (rows) => (rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1);

// ลบไฟล์รูปออกจากโฟลเดอร์ uploads (รับได้ทั้ง "/uploads/xxx.jpg" และ "xxx.jpg")
const removeFile = (url) => {
  if (!url) return; // ไม่มีรูปก็ข้าม
  const p = path.join(UPLOAD_DIR, path.basename(url));
  if (fs.existsSync(p)) fs.unlinkSync(p);
};

// เหมือน JOIN ใน SQL: เอาชื่อ catalog มาแปะที่หนังสือ จะได้โชว์ชื่อได้โดยไม่ต้องยิง API เพิ่ม
const withCatalog = (book, catalogs) => ({
  ...book,
  catalogName: catalogs.find((c) => c.id === book.catalogId)?.name ?? null,
});

// ---------- 4) ตั้งค่าการอัปโหลดไฟล์ (multer) ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR), // เก็บไว้ที่ไหน
  filename: (req, file, cb) =>
    // ตั้งชื่อใหม่ = เวลา + เลขสุ่ม + นามสกุลเดิม  (กันชื่อไฟล์ซ้ำ/ภาษาไทยเพี้ยน)
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e6) + path.extname(file.originalname)),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // จำกัดขนาด 5MB
  fileFilter: (req, file, cb) =>
    // รับเฉพาะไฟล์รูป: cb(null, true) = ผ่าน / cb(new Error) = ไม่ผ่าน
    /^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)
      ? cb(null, true)
      : cb(new Error("อนุญาตเฉพาะไฟล์รูปภาพ (jpg, png, gif, webp)")),
});
// วิธีใช้: ใส่ upload.single("cover") เป็นตัวกลางใน route
//   -> ไฟล์จะอยู่ที่ req.file   ส่วนช่องข้อความอื่นๆ อยู่ที่ req.body
//   -> "cover" ต้องตรงกับชื่อที่ frontend ใช้ fd.append("cover", file)

app.get("/", (req, res) => res.json({ message: "Library API is running" })); // ไว้เช็คว่า server ทำงาน

// =====================================================================
//  CATALOGS  (ตารางแม่)  — รับส่งเป็น JSON ไม่มีไฟล์
//  รูปแบบ CRUD: GET ทั้งหมด / GET ตาม id / POST เพิ่ม / PUT แก้ / DELETE ลบ
// =====================================================================

// READ ทั้งหมด  + นับจำนวนหนังสือในแต่ละ catalog (ไว้โชว์ในตาราง)
app.get("/api/catalogs", (req, res) => {
  const { books, catalogs } = readDb();
  res.json(catalogs.map((c) => ({ ...c, bookCount: books.filter((b) => b.catalogId === c.id).length })));
});

// READ ตาม id  (:id คือค่าใน URL -> req.params.id เป็น string ต้องแปลงเป็น Number)
app.get("/api/catalogs/:id", (req, res) => {
  const item = readDb().catalogs.find((c) => c.id === Number(req.params.id));
  if (!item) return res.status(404).json({ message: "ไม่พบ catalog" }); // 404 = ไม่พบ
  res.json(item);
});

// CREATE
app.post("/api/catalogs", (req, res) => {
  const { name, description = "" } = req.body;
  // validate: ต้องมีชื่อ (400 = ข้อมูลที่ส่งมาไม่ถูกต้อง)
  if (!name || !name.trim()) return res.status(400).json({ message: "กรุณากรอกชื่อ catalog" });
  const db = readDb();
  // ชื่อห้ามซ้ำ (409 = ขัดแย้งกับข้อมูลที่มีอยู่)
  if (db.catalogs.some((c) => c.name === name.trim()))
    return res.status(409).json({ message: "ชื่อ catalog ซ้ำ" });
  const item = { id: nextId(db.catalogs), name: name.trim(), description };
  db.catalogs.push(item);
  writeDb(db);
  res.status(201).json(item); // 201 = สร้างสำเร็จ
});

// UPDATE
app.put("/api/catalogs/:id", (req, res) => {
  const db = readDb();
  const idx = db.catalogs.findIndex((c) => c.id === Number(req.params.id)); // หาตำแหน่งในอาร์เรย์
  if (idx === -1) return res.status(404).json({ message: "ไม่พบ catalog" });
  if (!req.body.name || !req.body.name.trim()) return res.status(400).json({ message: "กรุณากรอกชื่อ catalog" });
  // เอาของเดิมมาตั้ง แล้วทับด้วยค่าใหม่
  db.catalogs[idx] = {
    ...db.catalogs[idx],
    name: req.body.name.trim(),
    description: req.body.description ?? db.catalogs[idx].description,
  };
  writeDb(db);
  res.json(db.catalogs[idx]);
});

// DELETE — จุดสำคัญของความสัมพันธ์ 1-N: ห้ามลบ catalog ที่ยังมีหนังสืออยู่
app.delete("/api/catalogs/:id", (req, res) => {
  const db = readDb();
  const id = Number(req.params.id);
  if (!db.catalogs.some((c) => c.id === id)) return res.status(404).json({ message: "ไม่พบ catalog" });
  if (db.books.some((b) => b.catalogId === id))
    return res.status(409).json({ message: "ลบไม่ได้ เพราะยังมีหนังสืออยู่ใน catalog นี้" });
  db.catalogs = db.catalogs.filter((c) => c.id !== id); // เก็บเฉพาะที่ไม่ใช่ id นี้ = ลบ
  writeDb(db);
  res.json({ message: "ลบ catalog เรียบร้อย", id });
});

// =====================================================================
//  BOOKS  (ตารางลูก)  — รับส่งเป็น multipart/form-data เพราะมีไฟล์ปก
// =====================================================================

// READ ทั้งหมด  รองรับ ?q=คำค้น  และ  ?catalogId=1
app.get("/api/books", (req, res) => {
  const { q = "", catalogId = "" } = req.query; // ค่าจาก query string
  const { books, catalogs } = readDb();
  let rows = books;
  if (q) rows = rows.filter((b) => (b.title + " " + b.author).toLowerCase().includes(q.toLowerCase())); // ค้นชื่อ+ผู้แต่ง
  if (catalogId) rows = rows.filter((b) => b.catalogId === Number(catalogId)); // กรองตาม catalog
  res.json(rows.map((b) => withCatalog(b, catalogs)).sort((a, b) => b.id - a.id)); // ใหม่สุดขึ้นก่อน
});

// READ ตาม id
app.get("/api/books/:id", (req, res) => {
  const { books, catalogs } = readDb();
  const item = books.find((b) => b.id === Number(req.params.id));
  if (!item) return res.status(404).json({ message: "ไม่พบหนังสือ" });
  res.json(withCatalog(item, catalogs));
});

// ตรวจข้อมูลก่อนบันทึก (ใช้ทั้งตอนเพิ่มและแก้) — คืนข้อความ error ถ้าไม่ผ่าน, คืน null ถ้าผ่าน
// *** ถ้าโจทย์เพิ่ม/ลด field ให้แก้ตรงนี้ ***
const validateBook = (body, catalogs) => {
  if (!body.title || !body.title.trim()) return "กรุณากรอกชื่อหนังสือ";
  if (!body.author || !body.author.trim()) return "กรุณากรอกชื่อผู้แต่ง";
  if (body.price === undefined || body.price === "" || Number(body.price) < 0) return "ราคาไม่ถูกต้อง";
  // เช็ค foreign key: catalogId ต้องมีอยู่จริงในตาราง catalogs
  if (!catalogs.some((c) => c.id === Number(body.catalogId))) return "ไม่พบ catalog ที่เลือก";
  return null;
};

// แปลงข้อมูลจากฟอร์ม -> object หนังสือ
// (multipart ส่งทุกอย่างมาเป็น string จึงต้อง Number() ตัวเลข)
// *** ถ้าโจทย์เพิ่ม/ลด field ให้แก้ตรงนี้ด้วย ***
const toBook = (body, old = {}) => ({
  ...old, // ของเดิม (ตอน PUT) เช่น id, cover, createdAt จะถูกเก็บไว้
  title: body.title.trim(),
  author: body.author.trim(),
  price: Number(body.price),
  stock: Number(body.stock || 0),
  catalogId: Number(body.catalogId),
  description: body.description ?? "",
});

// CREATE + อัปโหลดปก   (upload.single("cover") = รับไฟล์ 1 ไฟล์จากช่องชื่อ cover)
app.post("/api/books", upload.single("cover"), (req, res) => {
  const db = readDb();
  const err = validateBook(req.body, db.catalogs);
  if (err) {
    if (req.file) removeFile(req.file.filename); // ข้อมูลไม่ผ่าน -> ลบไฟล์ที่เพิ่งอัปโหลดทิ้ง ไม่ให้ค้างในโฟลเดอร์
    return res.status(400).json({ message: err });
  }
  const item = {
    id: nextId(db.books),
    ...toBook(req.body),
    cover: req.file ? `/uploads/${req.file.filename}` : null, // เก็บ "path" ลงข้อมูล ไม่ได้เก็บตัวไฟล์
    createdAt: new Date().toISOString(),
  };
  db.books.push(item);
  writeDb(db);
  res.status(201).json(withCatalog(item, db.catalogs));
});

// UPDATE + เปลี่ยนปกได้ (ถ้าไม่ส่งไฟล์มา = ใช้ปกเดิม)
app.put("/api/books/:id", upload.single("cover"), (req, res) => {
  const db = readDb();
  const idx = db.books.findIndex((b) => b.id === Number(req.params.id));
  if (idx === -1) {
    if (req.file) removeFile(req.file.filename); // ไม่พบข้อมูล -> ลบไฟล์ใหม่ที่เพิ่งอัปโหลด
    return res.status(404).json({ message: "ไม่พบหนังสือ" });
  }
  const err = validateBook(req.body, db.catalogs);
  if (err) {
    if (req.file) removeFile(req.file.filename);
    return res.status(400).json({ message: err });
  }
  const updated = toBook(req.body, db.books[idx]);
  if (req.file) {
    removeFile(db.books[idx].cover);              // ลบปกเก่าออกจากโฟลเดอร์
    updated.cover = `/uploads/${req.file.filename}`; // ใช้ปกใหม่แทน
  }
  updated.updatedAt = new Date().toISOString();
  db.books[idx] = updated;
  writeDb(db);
  res.json(withCatalog(updated, db.catalogs));
});

// DELETE — ลบข้อมูล + ลบไฟล์ปกด้วย
app.delete("/api/books/:id", (req, res) => {
  const db = readDb();
  const item = db.books.find((b) => b.id === Number(req.params.id));
  if (!item) return res.status(404).json({ message: "ไม่พบหนังสือ" });
  removeFile(item.cover);
  db.books = db.books.filter((b) => b.id !== item.id);
  writeDb(db);
  res.json({ message: "ลบหนังสือเรียบร้อย", id: item.id });
});

// ---------- ตัวจัดการ error สุดท้าย ----------
// error จาก multer (ไฟล์ผิดประเภท / ใหญ่เกิน) จะตกมาที่นี่ แล้วตอบกลับเป็น JSON ให้ frontend โชว์ได้
app.use((err, req, res, next) => res.status(400).json({ message: err.message }));

app.listen(PORT, () => console.log(`Library API -> http://localhost:${PORT}`));
