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

// หมายเหตุ: ช่องกรอกเงินมัดจำถูกเอาออกจากฟอร์มแล้ว แต่ยังเก็บ deposit ไว้ใน state
// เพื่อให้ตอนแก้ไขสัญญา ค่าเดิมในฐานข้อมูลถูกส่งกลับไปเท่าเดิม ไม่ถูกทับเป็น 0
const emptyForm = {
  room_id: '',
  tenant_id: '',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
  deposit: '',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function Leases() {
  const [leases, setLeases] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [leasesRes, roomsRes, tenantsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/leases`),
        axios.get(`${API_BASE}/api/rooms`),
        axios.get(`${API_BASE}/api/tenants`),
      ]);
      setLeases(leasesRes.data);
      setRooms(roomsRes.data);
      setTenants(tenantsRes.data);
    } catch (err) {
      setErrorMsg('โหลดข้อมูลการเช่าไม่สำเร็จ ตรวจสอบว่า backend เปิดอยู่หรือไม่');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (lease) => {
    setEditingId(lease.lease_id);
    setForm({
      room_id: lease.room_id,
      tenant_id: lease.tenant_id,
      start_date: lease.start_date ? lease.start_date.slice(0, 10) : '',
      end_date: lease.end_date ? lease.end_date.slice(0, 10) : '',
      deposit: lease.deposit || '', // ไม่แสดงในฟอร์ม แต่ส่งกลับไปเท่าเดิมตอนบันทึก
    });
    setShowModal(true);
  };

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/api/leases/${editingId}`, form);
      } else {
        await axios.post(`${API_BASE}/api/leases`, form);
      }
      setShowModal(false);
      await loadAll();
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
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: 0 }}>ข้อมูลการเช่า</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>สัญญาเช่าห้องพัก — วันที่เข้าพักและวันที่ย้ายออก</p>
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
          + สร้างสัญญาเช่า
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
            gridTemplateColumns: '1fr 1.6fr 1.2fr 1.2fr 1.4fr',
            padding: '14px 24px',
            backgroundColor: '#e8eefb',
            fontSize: '13px',
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          <span>ห้อง</span>
          <span>ผู้เช่า</span>
          <span>วันที่เข้าพัก</span>
          <span>วันที่ออก</span>
          <span>จัดการ</span>
        </div>

        {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>กำลังโหลดข้อมูล...</div>}

        {!loading && leases.length === 0 && !errorMsg && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>ยังไม่มีสัญญาเช่า</div>
        )}

        {!loading &&
          leases.map((l) => (
            <div
              key={l.lease_id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.6fr 1.2fr 1.2fr 1.4fr',
                padding: '16px 24px',
                borderTop: '1px solid #f1f5f9',
                alignItems: 'center',
                fontSize: '14px',
                color: '#334155',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>ห้อง {l.room_number}</div>
                <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>{l.room_type}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {l.first_name} {l.last_name}
                </div>
                <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>{l.phone}</div>
              </div>
              <span>{formatDate(l.start_date)}</span>
              <span>
                {l.end_date ? (
                  formatDate(l.end_date)
                ) : (
                  <span
                    style={{
                      backgroundColor: '#dcf5e6',
                      color: '#00915a',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      padding: '4px 12px',
                      borderRadius: '999px',
                    }}
                  >
                    ยังพักอยู่
                  </span>
                )}
              </span>
              <span style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => openEditModal(l)}
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
              </span>
            </div>
          ))}
      </div>

      {/* ========== Modal สร้าง/แก้ไขสัญญาเช่า ========== */}
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
              maxWidth: '440px',
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
                {editingId ? 'แก้ไขสัญญาเช่า' : 'สร้างสัญญาเช่าใหม่'}
              </h2>
            </div>

            <div style={{ padding: '26px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* 1. ห้องก่อน */}
              <div>
                <label style={labelStyle}>ห้อง</label>
                <select value={form.room_id} onChange={handleChange('room_id')} style={inputStyle}>
                  <option value="">— เลือกห้อง —</option>
                  {rooms.map((r) => (
                    <option key={r.room_id} value={r.room_id}>
                      {r.room_number} — {r.room_type}
                      {r.occupied_tenant_id ? ` (มีผู้เช่า: ${r.occupied_first_name} ${r.occupied_last_name})` : ' (ว่าง)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. แล้วค่อยชื่อผู้เช่า */}
              <div>
                <label style={labelStyle}>ผู้เช่า</label>
                <select value={form.tenant_id} onChange={handleChange('tenant_id')} style={inputStyle}>
                  <option value="">— เลือกผู้เช่า —</option>
                  {tenants.map((t) => (
                    <option key={t.tenant_id} value={t.tenant_id}>
                      {t.first_name} {t.last_name} ({t.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. แล้วค่อยวันที่เข้า/ออก */}
              <div>
                <label style={labelStyle}>วันที่เข้าพัก</label>
                <input type="date" value={form.start_date} onChange={handleChange('start_date')} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>วันที่ออก</label>
                <input type="date" value={form.end_date} onChange={handleChange('end_date')} style={inputStyle} />
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0 0' }}>
                  เว้นว่างไว้ถ้ายังพักอยู่ (ยังไม่ย้ายออก)
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

export default Leases;