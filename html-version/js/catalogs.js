// =====================================================================
//  catalogs.js — CRUD ตารางแม่ในหน้าเดียว (ฟอร์มด้านบน + ตารางด้านล่าง)
// =====================================================================
const formEl = document.getElementById("catalogForm");
const nameEl = document.getElementById("cName");
const descEl = document.getElementById("cDesc");
const saveEl = document.getElementById("cSave");
const cancelEl = document.getElementById("cCancel");
const rowsEl = document.getElementById("rows");

let editId = null; // null = โหมดเพิ่ม, มีเลข = กำลังแก้ catalog นั้น
let catalogs = []; // เก็บรายการล่าสุดไว้ ให้ปุ่มแก้ไขหาข้อมูลของแถวได้

// โหลดรายการแล้ววาดตาราง
async function load() {
  try {
    catalogs = await getCatalogs();
    rowsEl.innerHTML = catalogs.length === 0
      ? '<tr><td colspan="5" class="empty">ยังไม่มี catalog</td></tr>'
      : catalogs.map((c) => `
        <tr>
          <td>${c.id}</td><td>${esc(c.name)}</td><td>${esc(c.description)}</td><td>${c.bookCount}</td>
          <td class="row-actions">
            <button class="btn btn-outline" onclick="onEdit(${c.id})">แก้ไข</button>
            <button class="btn btn-danger" onclick="onDelete(${c.id})">ลบ</button>
          </td>
        </tr>`).join("");
  } catch (e) { showError(e.message); }
}

// กลับเป็นโหมดเพิ่ม + ล้างฟอร์ม
function reset() {
  editId = null;
  formEl.reset();
  saveEl.textContent = "+ เพิ่ม catalog";
  cancelEl.style.display = "none";
}

// กดแก้ไขในแถว: เอาค่ามาใส่ฟอร์ม + จำ id
function onEdit(id) {
  const c = catalogs.find((x) => x.id === id);
  editId = id;
  nameEl.value = c.name;
  descEl.value = c.description || "";
  saveEl.textContent = "บันทึกการแก้ไข";
  cancelEl.style.display = "inline-block";
}

// ลบ: ถ้ายังมีหนังสือ backend ตอบ 409 -> โชว์ข้อความ
async function onDelete(id) {
  if (!confirm("ต้องการลบ catalog นี้ใช่หรือไม่?")) return;
  showError("");
  try { await deleteCatalog(id); load(); } catch (e) { showError(e.message); }
}

// กดบันทึก: มี editId -> PUT, ไม่มี -> POST
formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  showError("");
  const body = { name: nameEl.value, description: descEl.value };
  try {
    if (editId) await updateCatalog(editId, body);
    else await createCatalog(body);
    reset();
    load();
  } catch (err) { showError(err.message); }
});
cancelEl.addEventListener("click", reset);

load();
