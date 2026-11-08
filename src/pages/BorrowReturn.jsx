import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';
const BLUE = '#2955a8';
const BLUE_LIGHT = '#2f6fed';

// คอลัมน์ของตาราง: ผู้เช่า | ห้อง | อุปกรณ์ | วันที่ยืม/กำหนดคืน | ค่ามัดจำ | สถานะ | จัดการ
const GRID_COLS = '1.6fr 0.7fr 1.4fr 1.5fr 1.2fr 1.1fr 1.7fr';

// สถานะจริงในฐานข้อมูล: pending, approved, returned (ไม่มี rejected — ไม่อนุมัติแล้วลบแถวทิ้งเลย)
const STATUS = {
  pending: { label: 'รออนุมัติ', bg: '#fef3c7', color: '#b45309' },
  approved: { label: 'กำลังยืม', bg: '#e0eaff', color: BLUE },
  returned: { label: 'คืนแล้ว', bg: '#d1fae5', color: '#059669' },
};

const TABS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รออนุมัติ' },
  { key: 'approved', label: 'กำลังยืม' },
  { key: 'returned', label: 'คืนแล้ว' },
];

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

// เกินกำหนดคืนหรือไม่ (นับเฉพาะรายการที่ยังยืมอยู่)
function isOverdue(record) {
  if (record.status !== 'approved' || !record.due_date) return false;
  const due = new Date(record.due_date);
  if (Number.isNaN(due.getTime())) return false;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return due < todayStart;
}

const actionBtn = (color, bg, disabled) => ({
  padding: '7px 14px',
  fontSize: '13px',
  fontWeight: 600,
  color,
  backgroundColor: bg,
  border: 'none',
  borderRadius: '8px',
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.6 : 1,
});

function BorrowReturn() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [tab, setTab] = useState('all');
  const [actingId, setActingId] = useState(null); // record ที่กำลังดำเนินการอยู่ (กันกดซ้ำ)
  const [slipView, setSlipView] = useState(null); // path สลิปที่กำลังเปิดดู

  // silent = true: โหลดเงียบๆ ไม่แสดง "กำลังโหลด" (ใช้ตอนรีเฟรชอัตโนมัติ/หลังกดปุ่ม)
  const loadRecords = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setErrorMsg('');
    }
    try {
      const res = await axios.get(`${API_BASE}/api/borrow-records`);
      setRecords(res.data);
    } catch (err) {
      if (!silent) setErrorMsg('โหลดรายการยืม-คืนไม่สำเร็จ ตรวจสอบว่า backend เปิดอยู่หรือไม่');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
    // ผู้เช่าส่งคำขอเข้ามาเรื่อยๆ เลยรีเฟรชรายการทุก 30 วินาที
    const timer = setInterval(() => loadRecords(true), 30000);
    return () => clearInterval(timer);
  }, []);

  // action: approve | reject | return
  const runAction = async (record, action, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setActingId(record.borrow_id);
    try {
      await axios.put(`${API_BASE}/api/borrow-records/${record.borrow_id}/${action}`);
    } catch (err) {
      alert(err.response?.data?.error || 'ดำเนินการไม่สำเร็จ');
    } finally {
      await loadRecords(true); // โหลดใหม่เสมอ ให้ตรงกับฐานข้อมูลจริง
      setActingId(null);
    }
  };

  const countOf = (key) => (key === 'all' ? records.length : records.filter((r) => r.status === key).length);
  const pendingCount = countOf('pending');
  const overdueCount = records.filter(isOverdue).length;
  const visible = tab === 'all' ? records : records.filter((r) => r.status === tab);

  return (
    <div>
      {/* ส่วนหัวหน้า */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: 0 }}>ยืม-คืนอุปกรณ์</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
          ตรวจสลิปค่ามัดจำ อนุมัติคำขอยืมจากผู้เช่า และบันทึกการรับคืนอุปกรณ์
        </p>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>
          {errorMsg}
        </div>
      )}

      {/* แจ้งเตือนคำขอที่รออนุมัติ */}
      {pendingCount > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: '#fef3c7',
            color: '#b45309',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <span>มีคำขอยืมรออนุมัติ {pendingCount} รายการ</span>
          {tab !== 'pending' && (
            <button onClick={() => setTab('pending')} style={actionBtn('#b45309', '#fde68a', false)}>
              ดูเฉพาะรออนุมัติ
            </button>
          )}
        </div>
      )}

      {/* แจ้งเตือนรายการที่เกินกำหนดคืน */}
      {overdueCount > 0 && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          มีอุปกรณ์เกินกำหนดคืน {overdueCount} รายการ
        </div>
      )}

      {/* แท็บกรองสถานะ */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 16px',
                fontSize: '13.5px',
                fontWeight: 600,
                color: active ? '#ffffff' : BLUE,
                backgroundColor: active ? BLUE_LIGHT : '#e8eefb',
                border: 'none',
                borderRadius: '999px',
                cursor: 'pointer',
              }}
            >
              {t.label} ({countOf(t.key)})
            </button>
          );
        })}
      </div>

      {/* ตารางรายการยืม-คืน */}
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
          <span>ผู้เช่า</span>
          <span>ห้อง</span>
          <span>อุปกรณ์</span>
          <span>วันที่ยืม / กำหนดคืน</span>
          <span>ค่ามัดจำ</span>
          <span>สถานะ</span>
          <span>จัดการ</span>
        </div>

        {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>กำลังโหลดข้อมูล...</div>}

        {!loading && visible.length === 0 && !errorMsg && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>ไม่มีรายการ</div>
        )}

        {!loading &&
          visible.map((r) => {
            const st = STATUS[r.status] || { label: r.status, bg: '#f1f5f9', color: '#475569' };
            const busy = actingId === r.borrow_id;
            const overdue = isOverdue(r);
            const deposit = Number(r.deposit_amount || 0);
            return (
              <div
                key={r.borrow_id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID_COLS,
                  padding: '16px 24px',
                  borderTop: '1px solid #f1f5f9',
                  alignItems: 'center',
                  fontSize: '14px',
                  color: '#334155',
                  backgroundColor: r.status === 'pending' ? '#fffbeb' : '#ffffff', // เน้นแถวที่รออนุมัติ
                }}
              >
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {r.first_name} {r.last_name}
                </span>
                <span>{r.room_number || '—'}</span>
                <span>{r.item_name}</span>

                {/* วันที่ยืม + กำหนดคืน */}
                <span style={{ lineHeight: 1.5 }}>
                  <div>{formatDate(r.borrow_date)}</div>
                  <div style={{ fontSize: '12.5px', color: overdue ? '#dc2626' : '#64748b', fontWeight: overdue ? 700 : 400 }}>
                    คืนภายใน {formatDate(r.due_date)}
                    {overdue && ' (เกินกำหนด)'}
                  </div>
                </span>

                {/* ค่ามัดจำ + ปุ่มดูสลิป */}
                <span style={{ lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>
                    {deposit > 0 ? `${deposit.toLocaleString()} บาท` : 'ไม่มีมัดจำ'}
                  </div>
                  {r.deposit_slip && (
                    <button
                      onClick={() => setSlipView(r.deposit_slip)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: BLUE_LIGHT,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      ดูสลิป
                    </button>
                  )}
                </span>

                <span>
                  <span
                    style={{
                      backgroundColor: st.bg,
                      color: st.color,
                      fontSize: '12.5px',
                      fontWeight: 600,
                      padding: '4px 12px',
                      borderRadius: '999px',
                    }}
                  >
                    {st.label}
                  </span>
                </span>
                <span style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {r.status === 'pending' && (
                    <>
                      <button disabled={busy} onClick={() => runAction(r, 'approve')} style={actionBtn('#ffffff', BLUE_LIGHT, busy)}>
                        อนุมัติ
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          runAction(
                            r,
                            'reject',
                            `ไม่อนุมัติคำขอยืม "${r.item_name}" ของ ${r.first_name} ${r.last_name}?` +
                              (deposit > 0 ? `\n(อย่าลืมคืนเงินมัดจำ ${deposit.toLocaleString()} บาทให้ผู้เช่า)` : '')
                          )
                        }
                        style={actionBtn('#dc2626', '#fee2e2', busy)}
                      >
                        ไม่อนุมัติ
                      </button>
                    </>
                  )}
                  {r.status === 'approved' && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        runAction(
                          r,
                          'return',
                          `ยืนยันรับคืน "${r.item_name}" จาก ${r.first_name} ${r.last_name}?` +
                            (deposit > 0 ? `\n(อย่าลืมคืนเงินมัดจำ ${deposit.toLocaleString()} บาท)` : '')
                        )
                      }
                      style={actionBtn(BLUE, '#e8eefb', busy)}
                    >
                      รับคืน
                    </button>
                  )}
                  {r.status === 'returned' && <span style={{ color: '#94a3b8' }}>—</span>}
                </span>
              </div>
            );
          })}
      </div>

      {/* Modal ดูสลิปค่ามัดจำ */}
      {slipView && (
        <div
          onClick={() => setSlipView(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15,23,42,0.6)',
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
              borderRadius: '16px',
              padding: '16px',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 24px 60px rgba(15,23,42,0.3)',
            }}
          >
            <img src={`${API_BASE}${slipView}`} alt="สลิปค่ามัดจำ" style={{ width: '100%', borderRadius: '10px', display: 'block' }} />
            <button
              onClick={() => setSlipView(null)}
              style={{ ...actionBtn('#475569', '#f1f5f9', false), width: '100%', marginTop: '12px', padding: '11px' }}
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BorrowReturn;