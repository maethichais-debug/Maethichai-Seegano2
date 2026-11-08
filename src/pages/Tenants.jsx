import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';
const BLUE = '#2955a8';
const BLUE_LIGHT = '#2f6fed';
const ORANGE = '#b45309';
const DANGER_DARK = '#991b1b';

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  fontSize: '14px',
  border: '1px solid #dbe3ef',
  borderRadius: '10px',
  backgroundColor: '#f8fafc',
  color: '#0f172a',
  boxSizing: 'border-box',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: '13.5px',
  fontWeight: 600,
  color: BLUE,
  marginBottom: '7px',
};

const sectionTitleStyle = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  margin: '4px 0 -4px 0',
  paddingTop: '8px',
  borderTop: '1px solid #f1f5f9',
};

// สุ่มรหัสผ่านเริ่มต้นแบบอ่านง่าย (ตัวอักษร + เลข 8 ตัว) — ใช้ตอนเพิ่มผู้เช่าใหม่เท่านั้น
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ========== กติกาตรวจจำนวนหลัก (แก้ตัวเลขตรงนี้ได้ถ้าต้องการเปลี่ยน) ==========
const ID_CARD_LEN = 13; // เลขบัตรประชาชน 13 หลัก
const PHONE_LEN = 10; // เบอร์โทรศัพท์ 10 หลัก
const BANK_MIN = 10; // เลขบัญชีธนาคาร อย่างน้อย 10 หลัก (ธนาคารส่วนใหญ่ 10 หลัก)
const BANK_MAX = 12; // และไม่เกิน 12 หลัก (ออมสิน / ธ.ก.ส. ใช้ 12 หลัก)

// นับเฉพาะตัวเลข ไม่นับขีด (-) หรือช่องว่าง
const digitsOf = (v) => String(v ?? '').replace(/\D/g, '');

// จัดช่องว่างในชื่อให้เป็นรูปแบบเดียวกัน (ตัดหัวท้าย + ยุบช่องว่างซ้อน) ใช้เทียบชื่อตอนยืนยันลบถาวร
const normalizeName = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const fullNameOf = (t) => normalizeName(`${t.first_name} ${t.last_name}`);

// คืนข้อความเตือน ถ้าถูกต้องแล้วคืนสตริงว่าง
function validateField(field, value) {
  const raw = String(value ?? '').trim();
  const n = digitsOf(raw).length;

  if (field === 'id_card' || field === 'phone') {
    const need = field === 'id_card' ? ID_CARD_LEN : PHONE_LEN;
    const label = field === 'id_card' ? 'เลขบัตรประชาชน' : 'เบอร์โทรศัพท์';
    if (!raw) return `กรุณากรอก${label}`;
    if (/[^0-9\-\s]/.test(raw)) return `${label}กรอกได้เฉพาะตัวเลข`;
    if (n < need) return `${label}ไม่ครบ ${need} หลัก (กรอกแล้ว ${n} หลัก ขาดอีก ${need - n} หลัก)`;
    if (n > need) return `${label}เกิน ${need} หลัก (กรอกแล้ว ${n} หลัก เกินมา ${n - need} หลัก)`;
    return '';
  }

  if (field === 'bank_account') {
    if (!raw) return ''; // เลขบัญชีไม่บังคับกรอก ถ้ากรอกถึงจะตรวจ
    if (n < BANK_MIN) return `เลขบัญชีไม่ครบ (ต้องมี ${BANK_MIN}–${BANK_MAX} หลัก กรอกแล้ว ${n} หลัก)`;
    if (n > BANK_MAX) return `เลขบัญชีเกิน ${BANK_MAX} หลัก (กรอกแล้ว ${n} หลัก เกินมา ${n - BANK_MAX} หลัก)`;
  }
  return '';
}

// ข้อความนับหลักเล็กๆ ใต้ช่อง เช่น "10/13 หลัก"
function counterText(field, value) {
  const n = digitsOf(value).length;
  if (field === 'id_card') return `${n}/${ID_CARD_LEN} หลัก`;
  if (field === 'phone') return `${n}/${PHONE_LEN} หลัก`;
  if (field === 'bank_account') return String(value ?? '').trim() ? `${n} หลัก` : '';
  return '';
}

// ข้อความใต้ช่องกรอก: ซ้าย = ข้อความเตือน (สีแดง), ขวา = ตัวนับหลัก
function FieldHint({ error, counter, showError }) {
  const hasError = showError && !!error;
  const valid = !error && !!counter;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '6px', fontSize: '12px' }}>
      <span style={{ color: '#dc2626', fontWeight: 600 }}>{hasError ? error : ''}</span>
      {counter && (
        <span style={{ color: hasError ? '#dc2626' : valid ? '#059669' : '#94a3b8', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
          {valid ? `✓ ${counter}` : counter}
        </span>
      )}
    </div>
  );
}

const emptyForm = {
  username: '',
  password: generatePassword(),
  first_name: '',
  last_name: '',
  id_card: '',
  phone: '',
  email: '',
  status: 'active',
  room_number: '',
  address: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_relation: '',
  bank_account: '',
};

const statusLabel = { active: 'เช่าอยู่', inactive: 'ย้ายออกแล้ว', pending: 'รอเข้าพัก' };

// คอลัมน์ของตาราง: ชื่อ | เบอร์โทร | ห้อง | สถานะ | จัดการ (มี 4 ปุ่ม เลยกว้างกว่าเดิม)
const GRID_COLS = '2fr 1.4fr 1fr 1fr 3.4fr';

// แถวแสดงข้อมูลแบบอ่านอย่างเดียวใน modal ดูข้อมูล
function ViewRow({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <span style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '14.5px', color: '#0f172a' }}>{value || '—'}</span>
    </div>
  );
}

function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = โหมดเพิ่มใหม่, มีค่า = โหมดแก้ไข
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [viewingTenant, setViewingTenant] = useState(null); // ผู้เช่าที่กำลังเปิดดูข้อมูล (read-only)

  // ลบถาวร: ผู้เช่าที่กำลังจะลบ + ชื่อที่พิมพ์ยืนยัน
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmName, setConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ช่องไหนที่ผู้ใช้กรอกแล้วออกจากช่อง (blur) จะเริ่มโชว์คำเตือน / submitted = กดบันทึกแล้วโชว์ทุกช่อง
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    id_card: validateField('id_card', form.id_card),
    phone: validateField('phone', form.phone),
    bank_account: validateField('bank_account', form.bank_account),
  };
  const showError = (field) => (touched[field] || submitted) && !!errors[field];
  const fieldStyle = (field) =>
    showError(field) ? { ...inputStyle, borderColor: '#f87171', backgroundColor: '#fef2f2' } : inputStyle;
  const handleBlur = (field) => () => setTouched((prev) => ({ ...prev, [field]: true }));

  const loadTenants = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.get(`${API_BASE}/api/tenants`);
      setTenants(res.data);
    } catch (err) {
      setErrorMsg('โหลดข้อมูลผู้เช่าไม่สำเร็จ ตรวจสอบว่า backend เปิดอยู่หรือไม่');
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/rooms`);
      setRooms(res.data);
    } catch (err) {
      console.error('โหลดรายการห้องไม่สำเร็จ', err);
    }
  };

  useEffect(() => {
    loadTenants();
    loadRooms();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...emptyForm, password: generatePassword() });
    setTouched({});
    setSubmitted(false);
    setShowModal(true);
    loadRooms();
  };

  const openEditModal = (tenant) => {
    setEditingId(tenant.tenant_id);
    const base = { ...emptyForm, ...tenant };
    // ค่าที่เป็น null จากฐานข้อมูล แปลงเป็นสตริงว่าง กันช่องกรอกและการตรวจสอบพัง
    Object.keys(emptyForm).forEach((k) => {
      if (base[k] == null) base[k] = '';
    });
    setForm(base);
    setTouched({});
    setSubmitted(false);
    setShowModal(true);
    loadRooms();
  };

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // ลบแบบเดิม: ใช้กับผู้เช่าที่ไม่มีประวัติ (ยืนยันครั้งเดียว)
  const handleDelete = async (id) => {
    if (!window.confirm('ยืนยันลบข้อมูลผู้เช่ารายนี้?')) return;
    try {
      await axios.delete(`${API_BASE}/api/tenants/${id}`);
      setTenants(tenants.filter((t) => t.tenant_id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'ลบข้อมูลไม่สำเร็จ');
    }
  };

  // ลบถาวร: ใช้กับผู้เช่าที่มีประวัติ ต้องพิมพ์ชื่อเต็มยืนยัน
  const openPermanentDelete = (tenant) => {
    setDeleteTarget(tenant);
    setConfirmName('');
  };

  const closePermanentDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setConfirmName('');
  };

  const nameMatched = !!deleteTarget && normalizeName(confirmName) === fullNameOf(deleteTarget);

  const handlePermanentDelete = async () => {
    if (!deleteTarget || !nameMatched) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_BASE}/api/tenants/${deleteTarget.tenant_id}/permanent`, {
        data: { confirm_name: confirmName },
      });
      setDeleteTarget(null);
      setConfirmName('');
      await loadTenants();
      await loadRooms();
    } catch (err) {
      alert(err.response?.data?.error || 'ลบถาวรไม่สำเร็จ');
    } finally {
      setDeleting(false);
    }
  };

  // ย้ายออก: ตั้งสถานะเป็น inactive + ปิดสัญญาเช่า (ห้องกลับมาว่าง) โดยเก็บประวัติไว้
  const handleMoveOut = async (tenant) => {
    if (!window.confirm(`ยืนยันบันทึกว่า ${tenant.first_name} ${tenant.last_name} ย้ายออก?\nห้องจะกลับมาว่าง และบัญชีนี้จะเข้าสู่ระบบไม่ได้`)) return;
    try {
      await axios.post(`${API_BASE}/api/tenants/${tenant.tenant_id}/move-out`);
      await loadTenants();
      await loadRooms();
    } catch (err) {
      alert(err.response?.data?.error || 'บันทึกการย้ายออกไม่สำเร็จ');
    }
  };

  const handleSave = async () => {
    // ตรวจเลขบัตร / เบอร์โทร / เลขบัญชี ก่อนบันทึก ถ้าไม่ผ่านให้โชว์คำเตือนและเลื่อนไปที่ช่องแรกที่ผิด
    setSubmitted(true);
    const firstInvalid = ['id_card', 'phone', 'bank_account'].find((k) => errors[k]);
    if (firstInvalid) {
      document.getElementById(`tenant-field-${firstInvalid}`)?.focus();
      return;
    }

    // เลขบัตรและเบอร์โทร เก็บเป็นตัวเลขล้วน (ตัดขีด/ช่องว่างออก) ให้รูปแบบในฐานข้อมูลเหมือนกันทุกคน
    const cleaned = {
      ...form,
      id_card: digitsOf(form.id_card),
      phone: digitsOf(form.phone),
      bank_account: String(form.bank_account ?? '').trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        // แก้ไขข้อมูล — ไม่ส่ง username/password ไปด้วย (endpoint แก้ไขไม่รองรับ)
        const {
          first_name, last_name, id_card, phone, email, status, room_number,
          address, emergency_contact_name, emergency_contact_phone, emergency_relation, bank_account,
        } = cleaned;
        await axios.put(`${API_BASE}/api/tenants/${editingId}`, {
          first_name, last_name, id_card, phone, email, status, room_number,
          address, emergency_contact_name, emergency_contact_phone, emergency_relation, bank_account,
        });
      } else {
        // เพิ่มผู้เช่าใหม่ — ใช้ endpoint สมัครสมาชิกเดิม (จะ hash รหัสผ่านให้อัตโนมัติ)
        const {
          username, password, first_name, last_name, id_card, phone, email, room_number,
          address, emergency_contact_name, emergency_contact_phone, emergency_relation, bank_account,
        } = cleaned;
        await axios.post(`${API_BASE}/api/auth/register`, {
          username, password, first_name, last_name, id_card, phone, email, room_number,
          address, emergency_contact_name, emergency_contact_phone, emergency_relation, bank_account,
        });
      }
      setShowModal(false);
      await loadTenants();
      await loadRooms();
    } catch (err) {
      alert(err.response?.data?.error || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: 0 }}>ผู้เช่า</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>จัดการข้อมูลผู้เช่าหอพัก</p>
        </div>
        <button
          onClick={openAddModal}
          style={{
            padding: '11px 20px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#ffffff',
            backgroundColor: BLUE_LIGHT,
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
        >
          + เพิ่มผู้เช่า
        </button>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>
          {errorMsg}
        </div>
      )}

      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID_COLS,
            padding: '14px 24px',
            backgroundColor: '#e8eefb',
            fontSize: '13px',
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          <span>ชื่อ-นามสกุล</span>
          <span>เบอร์โทร</span>
          <span>ห้อง</span>
          <span>สถานะ</span>
          <span>จัดการ</span>
        </div>

        {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>กำลังโหลดข้อมูล...</div>}

        {!loading && tenants.length === 0 && !errorMsg && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>ยังไม่มีข้อมูลผู้เช่า</div>
        )}

        {!loading &&
          tenants.map((t) => {
            const canDelete = !t.has_history;
            return (
              <div
                key={t.tenant_id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID_COLS,
                  padding: '16px 24px',
                  borderTop: '1px solid #f1f5f9',
                  alignItems: 'center',
                  fontSize: '14px',
                  color: '#334155',
                }}
              >
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {t.first_name} {t.last_name}
                </span>
                <span>{t.phone}</span>
                <span>{t.room_number || '—'}</span>
                <span>
                  <span
                    style={{
                      backgroundColor: '#e0eaff',
                      color: BLUE,
                      fontSize: '12.5px',
                      fontWeight: 600,
                      padding: '4px 12px',
                      borderRadius: '999px',
                    }}
                  >
                    {statusLabel[t.status] || t.status}
                  </span>
                </span>
                <span style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setViewingTenant(t)}
                    style={{
                      padding: '7px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#475569',
                      backgroundColor: '#f1f5f9',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    ดูข้อมูล
                  </button>

                  <button
                    onClick={() => openEditModal(t)}
                    style={{
                      padding: '7px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: BLUE,
                      backgroundColor: '#e8eefb',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    แก้ไขข้อมูล
                  </button>

                  {t.status === 'active' && (
                    <button
                      onClick={() => handleMoveOut(t)}
                      style={{
                        padding: '7px 14px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: ORANGE,
                        backgroundColor: '#fef3c7',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      ย้ายออก
                    </button>
                  )}

                  {canDelete ? (
                    <button
                      onClick={() => handleDelete(t.tenant_id)}
                      title="ลบผู้เช่า"
                      style={{
                        padding: '7px 14px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#dc2626',
                        backgroundColor: '#fee2e2',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      ลบ
                    </button>
                  ) : (
                    <button
                      onClick={() => openPermanentDelete(t)}
                      title="ลบผู้เช่าพร้อมประวัติทั้งหมด (กู้คืนไม่ได้)"
                      style={{
                        padding: '7px 14px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#ffffff',
                        backgroundColor: DANGER_DARK,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      ลบถาวร
                    </button>
                  )}
                </span>
              </div>
            );
          })}
      </div>

      {/* ========== Modal ยืนยันลบถาวร ========== */}
      {deleteTarget && (
        <div
          onClick={closePermanentDelete}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15,23,42,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              width: '100%',
              maxWidth: '460px',
              boxShadow: '0 24px 60px rgba(15,23,42,0.3)',
              overflow: 'hidden',
            }}
          >
            <div style={{ backgroundColor: DANGER_DARK, padding: '20px 28px' }}>
              <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#ffffff', margin: 0 }}>ลบผู้เช่าถาวร</h2>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
                กำลังจะลบ <b>{fullNameOf(deleteTarget)}</b> พร้อมข้อมูลทั้งหมด ได้แก่
                ประวัติการยืม-คืน, รายการการเงิน, สัญญาเช่า และข้อมูลผู้เช่า
                <br />
                <span style={{ color: '#dc2626', fontWeight: 600 }}>กู้คืนไม่ได้</span>{' '}
                และอุปกรณ์ที่ค้างยืมอยู่จะถูกคืนสถานะเป็น "ว่าง"
              </p>

              <div>
                <label style={labelStyle}>พิมพ์ชื่อเต็มเพื่อยืนยัน</label>
                <input
                  autoFocus
                  placeholder={fullNameOf(deleteTarget)}
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && nameMatched && !deleting) handlePermanentDelete();
                  }}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '0 28px 24px 28px' }}>
              <button
                onClick={closePermanentDelete}
                disabled={deleting}
                style={{
                  padding: '11px 22px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#475569',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={!nameMatched || deleting}
                style={{
                  padding: '11px 22px',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#ffffff',
                  backgroundColor: DANGER_DARK,
                  border: 'none',
                  borderRadius: '10px',
                  cursor: nameMatched && !deleting ? 'pointer' : 'not-allowed',
                  opacity: nameMatched && !deleting ? 1 : 0.4,
                }}
              >
                {deleting ? 'กำลังลบ...' : 'ลบถาวร'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== Modal ดูข้อมูลผู้เช่า (read-only) ========== */}
      {viewingTenant && (
        <div
          onClick={() => setViewingTenant(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15,23,42,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 24px 60px rgba(15,23,42,0.3)',
            }}
          >
            <div
              style={{
                background: `linear-gradient(100deg, ${BLUE_LIGHT} 0%, ${BLUE} 100%)`,
                padding: '22px 28px',
                borderRadius: '18px 18px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                ข้อมูลผู้เช่า
              </h2>
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '4px 12px',
                  borderRadius: '999px',
                }}
              >
                {statusLabel[viewingTenant.status] || viewingTenant.status}
              </span>
            </div>

            <div style={{ padding: '26px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <p style={sectionTitleStyle}>ข้อมูลส่วนตัว</p>
              <ViewRow label="ชื่อ-นามสกุล" value={`${viewingTenant.first_name} ${viewingTenant.last_name}`} />
              <ViewRow label="ชื่อผู้ใช้ (username)" value={viewingTenant.username} />
              <ViewRow label="เลขบัตรประชาชน" value={viewingTenant.id_card} />
              <ViewRow label="เบอร์โทรศัพท์" value={viewingTenant.phone} />
              <ViewRow label="อีเมล" value={viewingTenant.email} />
              <ViewRow label="ห้องพัก" value={viewingTenant.room_number} />
              <ViewRow label="ที่อยู่" value={viewingTenant.address} />

              <p style={sectionTitleStyle}>ผู้ติดต่อฉุกเฉิน</p>
              <ViewRow label="ชื่อ-นามสกุล" value={viewingTenant.emergency_contact_name} />
              <ViewRow label="เบอร์โทรศัพท์" value={viewingTenant.emergency_contact_phone} />
              <ViewRow label="ความสัมพันธ์" value={viewingTenant.emergency_relation} />

              <p style={sectionTitleStyle}>ข้อมูลการเงิน</p>
              <ViewRow label="เลขบัญชีธนาคาร" value={viewingTenant.bank_account} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '0 28px 26px 28px' }}>
              <button
                onClick={() => {
                  setViewingTenant(null);
                  openEditModal(viewingTenant);
                }}
                style={{
                  padding: '11px 22px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: BLUE,
                  backgroundColor: '#e8eefb',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                แก้ไขข้อมูล
              </button>
              <button
                onClick={() => setViewingTenant(null)}
                style={{
                  padding: '11px 22px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#475569',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== Modal เพิ่ม/แก้ไขผู้เช่า ========== */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15,23,42,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 24px 60px rgba(15,23,42,0.3)',
            }}
          >
            <div
              style={{
                background: `linear-gradient(100deg, ${BLUE_LIGHT} 0%, ${BLUE} 100%)`,
                padding: '22px 28px',
                borderRadius: '18px 18px 0 0',
              }}
            >
              <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                {editingId ? 'แก้ไขข้อมูลผู้เช่า' : 'เพิ่มผู้เช่าใหม่'}
              </h2>
            </div>

            <div style={{ padding: '26px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {!editingId && (
                <>
                  <div>
                    <label style={labelStyle}>ชื่อผู้ใช้ (username)</label>
                    <input placeholder="เช่น somchai01" value={form.username} onChange={handleChange('username')} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>รหัสผ่านเริ่มต้น</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        value={form.password}
                        onChange={handleChange('password')}
                        style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.5px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, password: generatePassword() })}
                        style={{
                          flexShrink: 0,
                          padding: '0 16px',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: BLUE,
                          backgroundColor: '#e8eefb',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        สุ่มใหม่
                      </button>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0 0' }}>
                      ผู้เช่าจะใช้รหัสนี้เข้าสู่ระบบครั้งแรก ระบบจะแฮชรหัสผ่านให้อัตโนมัติก่อนบันทึก
                    </p>
                  </div>
                </>
              )}

              <p style={sectionTitleStyle}>ข้อมูลส่วนตัว</p>

              <div>
                <label style={labelStyle}>ชื่อ</label>
                <input placeholder="เช่น สมชาย" value={form.first_name} onChange={handleChange('first_name')} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>นามสกุล</label>
                <input placeholder="เช่น ใจดี" value={form.last_name} onChange={handleChange('last_name')} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>เลขบัตรประชาชน</label>
                <input
                  id="tenant-field-id_card"
                  inputMode="numeric"
                  placeholder="เช่น 1234567890123"
                  value={form.id_card}
                  onChange={handleChange('id_card')}
                  onBlur={handleBlur('id_card')}
                  style={fieldStyle('id_card')}
                />
                <FieldHint error={errors.id_card} counter={counterText('id_card', form.id_card)} showError={showError('id_card')} />
              </div>

              <div>
                <label style={labelStyle}>เบอร์โทรศัพท์</label>
                <input
                  id="tenant-field-phone"
                  inputMode="numeric"
                  placeholder="เช่น 0891234567"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  onBlur={handleBlur('phone')}
                  style={fieldStyle('phone')}
                />
                <FieldHint error={errors.phone} counter={counterText('phone', form.phone)} showError={showError('phone')} />
              </div>

              <div>
                <label style={labelStyle}>อีเมล</label>
                <input placeholder="เช่น somchai@email.com" value={form.email} onChange={handleChange('email')} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>ที่อยู่ตามทะเบียนบ้าน</label>
                <textarea
                  placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด"
                  value={form.address}
                  onChange={handleChange('address')}
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <p style={sectionTitleStyle}>ผู้ติดต่อฉุกเฉิน</p>

              <div>
                <label style={labelStyle}>ชื่อ-นามสกุล</label>
                <input
                  placeholder="เช่น สมหญิง ใจดี"
                  value={form.emergency_contact_name}
                  onChange={handleChange('emergency_contact_name')}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>เบอร์โทรศัพท์</label>
                <input
                  placeholder="เช่น 089-999-8888"
                  value={form.emergency_contact_phone}
                  onChange={handleChange('emergency_contact_phone')}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>ความสัมพันธ์</label>
                <input
                  placeholder="เช่น มารดา, บิดา, พี่สาว"
                  value={form.emergency_relation}
                  onChange={handleChange('emergency_relation')}
                  style={inputStyle}
                />
              </div>

              <p style={sectionTitleStyle}>ข้อมูลการเงิน</p>

              <div>
                <label style={labelStyle}>เลขบัญชีธนาคาร</label>
                <input
                  id="tenant-field-bank_account"
                  placeholder="เช่น ธ.กรุงไทย 123-4-56789-0"
                  value={form.bank_account}
                  onChange={handleChange('bank_account')}
                  onBlur={handleBlur('bank_account')}
                  style={fieldStyle('bank_account')}
                />
                <FieldHint
                  error={errors.bank_account}
                  counter={counterText('bank_account', form.bank_account)}
                  showError={showError('bank_account')}
                />
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0 0' }}>
                  ใช้สำหรับโอนเงินมัดจำคืนเมื่อผู้เช่าย้ายออก (ไม่บังคับกรอก — นับเฉพาะตัวเลข 10–12 หลัก ไม่นับขีดหรือชื่อธนาคาร)
                </p>
              </div>

              <p style={sectionTitleStyle}>ห้องพักและสถานะ</p>

              <div>
                <label style={labelStyle}>ห้องพัก</label>
                <select value={form.room_number} onChange={handleChange('room_number')} style={inputStyle}>
                  <option value="">— ไม่ระบุห้อง —</option>
                  {rooms.map((r) => {
                    const isOccupiedByOther = r.occupied_tenant_id && r.occupied_tenant_id !== editingId;
                    return (
                      <option key={r.room_id} value={r.room_number} disabled={isOccupiedByOther}>
                        {r.room_number} — {r.room_type}
                        {isOccupiedByOther
                          ? ` (มีผู้เช่าอยู่: ${r.occupied_first_name} ${r.occupied_last_name})`
                          : ' (ว่าง)'}
                      </option>
                    );
                  })}
                </select>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0 0' }}>
                  ห้องที่มีผู้เช่าอยู่แล้วจะเลือกไม่ได้ (ยกเว้นเป็นห้องเดิมของผู้เช่าคนนี้)
                </p>
              </div>

              {editingId && (
                <div>
                  <label style={labelStyle}>สถานะ</label>
                  <select value={form.status} onChange={handleChange('status')} style={inputStyle}>
                    <option value="active">เช่าอยู่</option>
                    <option value="inactive">ย้ายออกแล้ว</option>
                    <option value="pending">รอเข้าพัก</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '0 28px 26px 28px' }}>
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                style={{
                  padding: '11px 22px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#475569',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '11px 22px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: BLUE_LIGHT,
                  border: 'none',
                  borderRadius: '10px',
                  cursor: saving ? 'default' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tenants;