import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';
const BLUE = '#2955a8';
const BLUE_LIGHT = '#2f6fed';

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

const emptyForm = {
  room_number: '',
  room_type: 'ห้องพัดลม',
  price: '',
  room_status: 'available',
};

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = โหมดเพิ่มใหม่, มีค่า = โหมดแก้ไข
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadRooms = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.get(`${API_BASE}/api/rooms`);
      setRooms(res.data);
    } catch (err) {
      setErrorMsg('โหลดข้อมูลห้องพักไม่สำเร็จ ตรวจสอบว่า backend เปิดอยู่หรือไม่');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (room) => {
    setEditingId(room.room_id);
    setForm({
      room_number: room.room_number,
      room_type: room.room_type,
      price: room.price,
      room_status: room.room_status,
    });
    setShowModal(true);
  };

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleDelete = async (room) => {
    if (room.occupied_tenant_id) {
      alert('ลบห้องนี้ไม่ได้ เพราะยังมีผู้เช่าอยู่ในห้องนี้ กรุณาย้ายผู้เช่าออกก่อน');
      return;
    }
    if (!window.confirm(`ยืนยันลบห้อง "${room.room_number}"?`)) return;

    try {
      await axios.delete(`${API_BASE}/api/rooms/${room.room_id}`);
      setRooms(rooms.filter((r) => r.room_id !== room.room_id));
    } catch (err) {
      alert(err.response?.data?.error || 'ลบห้องพักไม่สำเร็จ');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/api/rooms/${editingId}`, form);
      } else {
        await axios.post(`${API_BASE}/api/rooms`, form);
      }
      setShowModal(false);
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
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: 0 }}>ห้องพัก</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>จัดการข้อมูลห้องพักทั้งหมดของหอพัก</p>
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
          + เพิ่มห้องพัก
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
            gridTemplateColumns: '1fr 1.4fr 1fr 1.6fr 1.4fr',
            padding: '14px 24px',
            backgroundColor: '#e8eefb',
            fontSize: '13px',
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          <span>เลขห้อง</span>
          <span>ประเภท</span>
          <span>ราคา/เดือน</span>
          <span>สถานะ</span>
          <span>จัดการ</span>
        </div>

        {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>กำลังโหลดข้อมูล...</div>}

        {!loading && rooms.length === 0 && !errorMsg && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>ยังไม่มีข้อมูลห้องพัก</div>
        )}

        {!loading &&
          rooms.map((r) => (
            <div
              key={r.room_id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.4fr 1fr 1.6fr 1.4fr',
                padding: '16px 24px',
                borderTop: '1px solid #f1f5f9',
                alignItems: 'center',
                fontSize: '14px',
                color: '#334155',
              }}
            >
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{r.room_number}</span>
              <span>{r.room_type}</span>
              <span>฿{Number(r.price).toLocaleString()}</span>
              <span>
                {r.occupied_tenant_id ? (
                  <span
                    style={{
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      padding: '4px 12px',
                      borderRadius: '999px',
                    }}
                  >
                    มีผู้เช่า: {r.occupied_first_name} {r.occupied_last_name}
                  </span>
                ) : (
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
                    ว่าง
                  </span>
                )}
              </span>
              <span style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => openEditModal(r)}
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
                  onClick={() => handleDelete(r)}
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

      {/* ========== Modal เพิ่ม/แก้ไขห้องพัก ========== */}
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
              maxWidth: '420px',
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
                {editingId ? 'แก้ไขข้อมูลห้องพัก' : 'เพิ่มห้องพักใหม่'}
              </h2>
            </div>

            <div style={{ padding: '26px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle}>เลขห้อง</label>
                <input placeholder="เช่น 103" value={form.room_number} onChange={handleChange('room_number')} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>ประเภทห้อง</label>
                <select value={form.room_type} onChange={handleChange('room_type')} style={inputStyle}>
                  <option value="ห้องพัดลม">ห้องพัดลม</option>
                  <option value="ห้องแอร์">ห้องแอร์</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>ราคาต่อเดือน (บาท)</label>
                <input
                  type="number"
                  placeholder="เช่น 3000"
                  value={form.price}
                  onChange={handleChange('price')}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>สถานะห้อง</label>
                <select value={form.room_status} onChange={handleChange('room_status')} style={inputStyle}>
                  <option value="available">ว่าง / ให้เช่าได้</option>
                  <option value="maintenance">ปิดปรับปรุง</option>
                </select>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0 0' }}>
                  สถานะ "มีผู้เช่า" จะคำนวณอัตโนมัติจากข้อมูลสัญญาเช่า ไม่ต้องตั้งเองตรงนี้
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

export default Rooms;