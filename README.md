# Library — CRUD 2 ตาราง (catalogs 1—N books) + อัปโหลดปก

โปรเจกต์ฝึกสอบ Web Contemporary: Next.js (App Router) + Express + Multer

## วิธีรัน
```bash
# Backend -> http://localhost:4000
cd backend && npm install && npm start

# Frontend -> http://localhost:3000 (เปิดอีก terminal)
cd frontend && npm install && npm run dev
```
แก้ URL ของ API ได้ที่ `frontend/.env.local` (`NEXT_PUBLIC_API_URL`)

## API
| Method | Path | หมายเหตุ |
|---|---|---|
| GET/POST | `/api/catalogs` | JSON |
| GET/PUT/DELETE | `/api/catalogs/:id` | DELETE → 409 ถ้ายังมีหนังสือ |
| GET | `/api/books?q=&catalogId=` | ค้นหา + กรอง, แนบ `catalogName` |
| POST | `/api/books` | multipart/form-data, ไฟล์ field ชื่อ `cover` |
| GET/PUT/DELETE | `/api/books/:id` | PUT เปลี่ยนปกได้, DELETE ลบไฟล์ปกด้วย |

ข้อกำหนด validate: `title`, `author`, `price`, `catalogId` (ต้องมีอยู่จริง) — ผิดตอบ 400

## ฝึก gen code จาก OpenAPI
ไฟล์ `openapi.yaml` อธิบาย API ทั้งหมด

```bash
# Backend (Express)
npx @openapitools/openapi-generator-cli generate -i openapi.yaml -g nodejs-express-server -o gen/backend
# Frontend client (TypeScript types)
npx openapi-typescript openapi.yaml -o gen/api-types.ts
# Frontend client (ฟังก์ชันเรียก API)
npx orval --input openapi.yaml --output gen/client.ts
```
หรือ Import `openapi.yaml` เข้า Postman เพื่อสร้าง Collection

## จุดที่ควรเข้าใจสำหรับสอบ
- ฟอร์มอัปโหลดใช้ `FormData` และห้ามตั้ง `Content-Type` เอง (browser ใส่ boundary ให้)
- ชื่อ field ไฟล์ต้องตรงกัน: `fd.append("cover", file)` ↔ `upload.single("cover")`
- ลบ/เปลี่ยนปกต้องลบไฟล์เก่าด้วย, ข้อมูลไม่ผ่าน validate ต้องลบไฟล์ที่เพิ่งอัปโหลด
- Foreign key: เช็ค `catalogId` ก่อนบันทึก และกันลบ catalog ที่ยังมีหนังสือ (409)

## ลำดับทำในห้องสอบ (แนะนำ)
1. Backend: ตั้ง `express + cors + multer` และ helper อ่าน/เขียนข้อมูล (ส่วนบนของ `server.js`)
2. ทำ CRUD ตารางแม่ (catalogs) ก่อน → ทดสอบใน Postman/Swagger
3. ทำ CRUD ตารางลูก (books) + `validateBook` + อัปโหลดปก → ทดสอบส่งไฟล์
4. Frontend: `lib/api.js` → หน้า list (ค้นหา/กรอง/ลบ) → `BookForm` (เพิ่ม/แก้ไข + อัปโหลด) → หน้ารายละเอียด → หน้า catalogs
5. ไล่เช็ค: ลบ catalog ที่มีหนังสือ (409), ไฟล์ไม่ใช่รูป (400), เปลี่ยนปกแล้วไฟล์เก่าถูกลบ

> คอมเมนต์ในโค้ดทุกไฟล์เป็นภาษาไทย ไล่อ่านจาก `backend/server.js` ก่อนได้เลย
