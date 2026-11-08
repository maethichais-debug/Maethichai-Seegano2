import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';
const BLUE = '#2955a8';
const BLUE_LIGHT = '#2f6fed';
const MAX_IMAGE_MB = 2;
const CATEGORIES = ['เครื่องใช้ไฟฟ้า', 'เฟอร์นิเจอร์', 'เครื่องครัว', 'อื่นๆ'];

// คอลัมน์ของตาราง: รูป | ชื่ออุปกรณ์ | หมวดหมู่ | จำนวนทั้งหมด | คงเหลือ | ค่ามัดจำ | จัดการ
const GRID_COLS = '0.9fr 1.8fr 1.2fr 0.9fr 0.9fr 1.2fr 1.6fr';

const UNIT_STATUS = {
  available: { label: 'พร้อมให้ยืม', bg: '#d1fae5', color: '#059669' },
  borrowed: { label: 'กำลังยืม', bg: '#fef3c7', color: '#b45309' },
  damaged: { label: 'ชำรุด', bg: '#fee2e2', color: '#dc2626' },
};

// ตัวเลือกในดรอปดาวน์ — แอดมินตั้งได้แค่ 2 แบบนี้ ส่วน "กำลังยืม" ระบบยืม-คืนเป็นคนตั้งให้
const UNIT_STATUS_OPTIONS = ['available', 'damaged'];

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

const emptyForm = { item_name: '', category: CATEGORIES[0], total_quantity: '', deposit: '', apply_all: false, image: '' };

// แสดงค่ามัดจำเป็นช่วง เมื่อแต่ละชิ้นตั้งไม่เท่ากัน
const formatDeposit = (min, max) => {
  if (min == null || max == null) return '—';
  const a = Number(min);
  const b = Number(max);
  return a === b ? `${a.toLocaleString()} บาท` : `${a.toLocaleString()} – ${b.toLocaleString()} บาท`;
};

function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = โหมดเพิ่มใหม่, มีค่า = โหมดแก้ไข
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // ========== state สำหรับ modal ดูรายชิ้น ==========
  const [viewingItemId, setViewingItemId] = useState(null); // item_id ที่กำลังเปิดดูรายชิ้นอยู่
  const [unitsData, setUnitsData] = useState(null); // { item, units }
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitsError, setUnitsError] = useState('');
  const [unitDeposits, setUnitDeposits] = useState({}); // { unit_id: 'ค่าที่กำลังพิมพ์' }
  const [savingUnitId, setSavingUnitId] = useState(null);
  const [statusSavingId, setStatusSavingId] = useState(null); // ชิ้นที่กำลังเปลี่ยนสถานะอยู่

  const loadItems = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.get(`${API_BASE}/api/admin/items`);
      setItems(res.data);
    } catch (err) {
      setErrorMsg('โหลดข้อมูลอุปกรณ์ไม่สำเร็จ ตรวจสอบว่า backend เปิดอยู่หรือไม่');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.item_id);
    setForm({
      item_name: item.item_name,
      category: item.category || CATEGORIES[0],
      total_quantity: item.total_quantity,
      deposit: item.deposit ?? '',
      apply_all: true, // ค่าเริ่มต้น: ใช้กับทุกชิ้นเดิมด้วย
      image: item.image || '',
    });
    setShowModal(true);
  };

  // เปิด modal ดูรายชิ้น — โหลดรายชิ้นจาก backend ทุกครั้งที่เปิด เพื่อให้สถานะล่าสุดเสมอ
  const openUnitsModal = async (itemId) => {
    setViewingItemId(itemId);
    setUnitsData(null);
    setUnitsError('');
    setUnitsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/items/${itemId}/units`);
      setUnitsData(res.data);
      setUnitDeposits(
        Object.fromEntries(res.data.units.map((u) => [u.unit_id, String(Number(u.deposit || 0))]))
      );
    } catch (err) {
      setUnitsError('โหลดรายชิ้นไม่สำเร็จ');
    } finally {
      setUnitsLoading(false);
    }
  };

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // เลือกรูป -> แปลงเป็น data URL (base64) เพื่อแสดงตัวอย่างและส่งไปเก็บในฐานข้อมูลจริง
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      alert(`ไฟล์รูปต้องมีขนาดไม่เกิน ${MAX_IMAGE_MB} MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const name = form.item_name.trim();
    const total = parseInt(form.total_quantity, 10);
    const deposit = form.deposit === '' ? 0 : Number(form.deposit);

    if (!name) {
      alert('กรุณากรอกชื่ออุปกรณ์');
      return;
    }
    if (Number.isNaN(total) || total < 0) {
      alert('กรุณากรอกจำนวนทั้งหมดให้ถูกต้อง');
      return;
    }
    if (Number.isNaN(deposit) || deposit < 0) {
      alert('กรุณากรอกค่ามัดจำให้ถูกต้อง');
      return;
    }

    setSaving(true);
    try {
      const payload = { item_name: name, category: form.category, total_quantity: total, deposit, image: form.image };
      if (editingId) payload.apply_to_all = form.apply_all;
      if (editingId) {
        await axios.put(`${API_BASE}/api/admin/items/${editingId}`, payload);
      } else {
        await axios.post(`${API_BASE}/api/admin/items`, payload);
      }
      setShowModal(false);
      await loadItems(); // โหลดใหม่จากฐานข้อมูลจริง (จำนวน/คงเหลือคำนวณจากรายชิ้นจริงแล้ว)
    } catch (err) {
      alert(err.response?.data?.error || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ยืนยันลบรายการอุปกรณ์นี้? (จะลบทุกชิ้นของอุปกรณ์ประเภทนี้ไปด้วย)')) return;
    try {
      await axios.delete(`${API_BASE}/api/admin/items/${id}`);
      setItems(items.filter((i) => i.item_id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'ลบข้อมูลไม่สำเร็จ');
    }
  };

  // บันทึกค่ามัดจำของชิ้นเดียว
  const saveUnitDeposit = async (unit) => {
    const raw = unitDeposits[unit.unit_id];
    const value = raw === '' ? 0 : Number(raw);
    if (Number.isNaN(value) || value < 0) {
      alert('กรุณากรอกค่ามัดจำให้ถูกต้อง');
      return;
    }
    setSavingUnitId(unit.unit_id);
    try {
      await axios.put(`${API_BASE}/api/admin/units/${unit.unit_id}/deposit`, { deposit: value });
      setUnitsData((prev) => ({
        ...prev,
        units: prev.units.map((u) => (u.unit_id === unit.unit_id ? { ...u, deposit: value } : u)),
      }));
      setUnitDeposits((prev) => ({ ...prev, [unit.unit_id]: String(value) }));
      loadItems(); // อัปเดตช่วงค่ามัดจำในตารางหลัก
    } catch (err) {
      alert(err.response?.data?.error || 'บันทึกค่ามัดจำไม่สำเร็จ');
    } finally {
      setSavingUnitId(null);
    }
  };

  // เปลี่ยนสถานะรายชิ้น: พร้อมให้ยืม <-> ชำรุด (บันทึกทันทีที่เลือกในดรอปดาวน์)
  const updateUnitStatus = async (unit, newStatus) => {
    if (newStatus === unit.status) return;
    setStatusSavingId(unit.unit_id);
    try {
      await axios.put(`${API_BASE}/api/admin/units/${unit.unit_id}/status`, { status: newStatus });
      setUnitsData((prev) => ({
        ...prev,
        units: prev.units.map((u) => (u.unit_id === unit.unit_id ? { ...u, status: newStatus } : u)),
      }));
      loadItems(); // อัปเดตจำนวนคงเหลือในตารางหลัก
    } catch (err) {
      alert(err.response?.data?.error || 'เปลี่ยนสถานะไม่สำเร็จ');
    } finally {
      setStatusSavingId(null);
    }
  };

  // นับจำนวนแต่ละสถานะ ไว้โชว์ที่หัว modal
  const countByStatus = (status) => (unitsData ? unitsData.units.filter((u) => u.status === status).length : 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: 0 }}>อุปกรณ์</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>จัดการรายการอุปกรณ์และทรัพย์สินในระบบ</p>
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
          + เพิ่มอุปกรณ์
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
          <span>รูป</span>
          <span>ชื่ออุปกรณ์</span>
          <span>หมวดหมู่</span>
          <span>จำนวนทั้งหมด</span>
          <span>คงเหลือ</span>
          <span>ค่ามัดจำ</span>
          <span>จัดการ</span>
        </div>

        {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>กำลังโหลดข้อมูล...</div>}

        {!loading && items.length === 0 && !errorMsg && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>ยังไม่มีรายการอุปกรณ์</div>
        )}

        {!loading &&
          items.map((item) => (
            <div
              key={item.item_id}
              style={{
                display: 'grid',
                gridTemplateColumns: GRID_COLS,
                padding: '14px 24px',
                borderTop: '1px solid #f1f5f9',
                alignItems: 'center',
                fontSize: '14px',
                color: '#334155',
              }}
            >
              <span>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: '#e8eefb',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.item_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    '📦'
                  )}
                </div>
              </span>
              {/* คลิกชื่อเพื่อดูรายชิ้นทั้งหมดของอุปกรณ์ประเภทนี้ — แต่ละชิ้นมีรหัสไม่ซ้ำกัน */}
              <button
                onClick={() => openUnitsModal(item.item_id)}
                title="ดูรายชิ้นทั้งหมด"
                style={{
                  justifySelf: 'start',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#0f172a',
                  cursor: 'pointer',
                  textAlign: 'left',
                  textDecoration: 'underline',
                  textDecorationColor: '#dbe3ef',
                  textUnderlineOffset: '3px',
                }}
              >
                {item.item_name}
              </button>
              <span>{item.category || '—'}</span>
              <span>{item.total_quantity} ชิ้น</span>
              <span>
                <span
                  style={{
                    backgroundColor: item.available_quantity > 0 ? '#e0eaff' : '#fee2e2',
                    color: item.available_quantity > 0 ? BLUE : '#dc2626',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '999px',
                  }}
                >
                  {item.available_quantity} ชิ้น
                </span>
              </span>
              <span>{formatDeposit(item.deposit_min, item.deposit_max)}</span>
              <span style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => openEditModal(item)}
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
                <button
                  onClick={() => handleDelete(item.item_id)}
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
              </span>
            </div>
          ))}
      </div>

      {/* ========== Modal ดูรายชิ้นทั้งหมด (ภาพเดียวกัน แต่ละชิ้นรหัส ค่ามัดจำ และสถานะต่างกันได้) ========== */}
      {viewingItemId && (
        <div
          onClick={() => setViewingItemId(null)}
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
              maxWidth: '600px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 60px rgba(15,23,42,0.3)',
            }}
          >
            {unitsLoading && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>กำลังโหลดข้อมูล...</div>
            )}

            {unitsError && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626', fontSize: '14px' }}>{unitsError}</div>
            )}

            {!unitsLoading && !unitsError && unitsData && (
              <>
                {/* หัว modal: รูปเดียวกันทุกชิ้น + ชื่อ + หมวดหมู่ + สรุปจำนวนแต่ละสถานะ */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '22px 24px',
                    background: `linear-gradient(100deg, ${BLUE_LIGHT} 0%, ${BLUE} 100%)`,
                    borderRadius: '18px 18px 0 0',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '26px',
                      flexShrink: 0,
                    }}
                  >
                    {unitsData.item.image ? (
                      <img
                        src={unitsData.item.image}
                        alt={unitsData.item.item_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      '📦'
                    )}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: 0 }}>{unitsData.item.item_name}</h2>
                    <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.75)', margin: '3px 0 0 0' }}>
                      {unitsData.item.category || '—'} · ทั้งหมด {unitsData.units.length} ชิ้น · พร้อมให้ยืม {countByStatus('available')} · ชำรุด{' '}
                      {countByStatus('damaged')}
                    </p>
                  </div>
                </div>

                {/* รายชิ้น: รหัสไม่ซ้ำกัน + ค่ามัดจำรายชิ้น + สถานะรายชิ้น (ดรอปดาวน์) */}
                <div style={{ overflowY: 'auto', padding: '8px 0' }}>
                  {unitsData.units.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                      ยังไม่มีชิ้นสำหรับอุปกรณ์นี้
                    </div>
                  )}
                  {unitsData.units.map((unit, i) => {
                    const st = UNIT_STATUS[unit.status] || { label: unit.status, bg: '#f1f5f9', color: '#475569' };
                    const current = unitDeposits[unit.unit_id] ?? '';
                    const changed = current !== String(Number(unit.deposit || 0));
                    const isBorrowed = unit.status === 'borrowed';
                    const statusBusy = statusSavingId === unit.unit_id;
                    return (
                      <div
                        key={unit.unit_id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 24px',
                          borderTop: i === 0 ? 'none' : '1px solid #f1f5f9',
                        }}
                      >
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a', fontSize: '14px', letterSpacing: '0.3px', flex: 1 }}>
                          {unit.unit_code}
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={current}
                          onChange={(e) => setUnitDeposits({ ...unitDeposits, [unit.unit_id]: e.target.value })}
                          style={{ ...inputStyle, width: '90px', padding: '6px 10px', fontSize: '13px' }}
                        />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>บาท</span>

                        <button
                          onClick={() => saveUnitDeposit(unit)}
                          disabled={!changed || savingUnitId === unit.unit_id}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: BLUE,
                            backgroundColor: '#e8eefb',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: changed ? 'pointer' : 'default',
                            opacity: changed ? 1 : 0.4,
                          }}
                        >
                          {savingUnitId === unit.unit_id ? '...' : 'บันทึก'}
                        </button>

                        {isBorrowed ? (
                          // ชิ้นที่กำลังถูกยืมอยู่ เปลี่ยนสถานะเองไม่ได้ ต้องรับคืนผ่านหน้า ยืม-คืน ก่อน
                          <span
                            title="กำลังถูกยืมอยู่ ต้องรับคืนก่อนจึงจะเปลี่ยนสถานะได้"
                            style={{
                              backgroundColor: st.bg,
                              color: st.color,
                              fontSize: '12px',
                              fontWeight: 600,
                              padding: '6px 11px',
                              borderRadius: '999px',
                              width: '112px',
                              boxSizing: 'border-box',
                              textAlign: 'center',
                            }}
                          >
                            {st.label}
                          </span>
                        ) : (
                          <select
                            value={unit.status}
                            disabled={statusBusy}
                            onChange={(e) => updateUnitStatus(unit, e.target.value)}
                            style={{
                              backgroundColor: st.bg,
                              color: st.color,
                              fontSize: '12px',
                              fontWeight: 600,
                              padding: '6px 8px',
                              borderRadius: '999px',
                              border: 'none',
                              width: '112px',
                              cursor: statusBusy ? 'default' : 'pointer',
                              opacity: statusBusy ? 0.6 : 1,
                              outline: 'none',
                            }}
                          >
                            {UNIT_STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>
                                {UNIT_STATUS[s].label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{ padding: '18px 24px', borderTop: '1px solid #f1f5f9' }}>
              <button
                onClick={() => setViewingItemId(null)}
                style={{
                  width: '100%',
                  padding: '11px',
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

      {/* ========== Modal เพิ่ม/แก้ไขอุปกรณ์ ========== */}
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
                {editingId ? 'แก้ไขข้อมูลอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}
              </h2>
              {!editingId && (
                <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.75)', margin: '4px 0 0 0' }}>
                  ระบบจะสุ่มรหัสให้แต่ละชิ้นอัตโนมัติ เช่น EQ-X7K2P9-01, -02, ...
                </p>
              )}
            </div>

            <div style={{ padding: '26px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle}>รูปอุปกรณ์</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '96px',
                      height: '96px',
                      flexShrink: 0,
                      borderRadius: '12px',
                      border: '1px dashed #b9c7e0',
                      backgroundColor: '#f8fafc',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '30px',
                    }}
                  >
                    {form.image ? (
                      <img src={form.image} alt="ตัวอย่างรูปอุปกรณ์" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      '📦'
                    )}
                  </div>

                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: BLUE,
                          backgroundColor: '#e8eefb',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        {form.image ? 'เปลี่ยนรูป' : 'เลือกรูป'}
                      </button>
                      {form.image && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, image: '' })}
                          style={{
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#dc2626',
                            backgroundColor: '#fee2e2',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                          }}
                        >
                          ลบรูป
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0 0 0' }}>
                      รองรับไฟล์รูปภาพ ขนาดไม่เกิน {MAX_IMAGE_MB} MB — ใช้รูปเดียวกันทุกชิ้นของประเภทนี้
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>ชื่ออุปกรณ์</label>
                <input placeholder="เช่น พัดลมไอเย็น" value={form.item_name} onChange={handleChange('item_name')} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>หมวดหมู่</label>
                <select value={form.category} onChange={handleChange('category')} style={inputStyle}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>จำนวนทั้งหมด</label>
                <input
                  type="number"
                  min="0"
                  placeholder="เช่น 10"
                  value={form.total_quantity}
                  onChange={handleChange('total_quantity')}
                  style={inputStyle}
                />
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0 0' }}>
                  {editingId
                    ? 'เพิ่มจำนวน = สร้างชิ้นใหม่ให้อัตโนมัติ · ลดจำนวน = ลบได้เฉพาะชิ้นที่ยังว่างอยู่'
                    : 'ระบบจะสร้างรายชิ้นตามจำนวนนี้ให้อัตโนมัติ แต่ละชิ้นมีรหัสของตัวเอง'}
                </p>
              </div>

              <div>
                <label style={labelStyle}>ค่ามัดจำเริ่มต้น (บาท / ชิ้น)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="เช่น 500 (ไม่มีค่ามัดจำใส่ 0)"
                  value={form.deposit}
                  onChange={handleChange('deposit')}
                  style={inputStyle}
                />
                {editingId && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.apply_all}
                      onChange={(e) => setForm({ ...form, apply_all: e.target.checked })}
                    />
                    ใช้ค่านี้กับทุกชิ้นเดิมด้วย (จะทับค่ามัดจำรายชิ้นที่เคยตั้งไว้)
                  </label>
                )}
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0 0' }}>
                  {editingId
                    ? 'ถ้าไม่ติ๊ก ค่านี้จะใช้กับชิ้นที่สร้างใหม่เท่านั้น — แก้รายชิ้นได้ที่หน้า "ดูรายชิ้น" (คลิกชื่ออุปกรณ์)'
                    : 'ใช้เป็นค่ามัดจำของทุกชิ้นที่สร้างใหม่ — แก้รายชิ้นทีหลังได้ที่หน้า "ดูรายชิ้น"'}
                </p>
              </div>
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

export default Items;