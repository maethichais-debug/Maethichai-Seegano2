import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ConfirmPopup from './ConfirmPopup';

const API_BASE = 'http://localhost:5000';
const BLUE = '#2955a8';

const STATUS = {
  pending: { label: 'รออนุมัติ', bg: '#fef3c7', color: '#b45309' },
  approved: { label: 'กำลังยืม', bg: '#e0eaff', color: BLUE },
  returned: { label: 'คืนแล้ว', bg: '#d1fae5', color: '#059669' },
};

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

function TenantHistory({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(null); // record ที่กำลังจะยกเลิก
  const [cancelling, setCancelling] = useState(false);
  const [resultPopup, setResultPopup] = useState(null); // { type: 'success' | 'error', message }

  const loadRecords = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/tenant/${user.id}/borrow-records`);
      setRecords(res.data);
    } catch (err) {
      setErrorMsg('โหลดประวัติการยืม-คืนไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [user.id]);

  const handleConfirmCancel = async () => {
    const record = confirmCancel;
    setCancelling(true);
    try {
      await axios.put(`${API_BASE}/api/tenant/${user.id}/borrow-records/${record.borrow_id}/cancel`);
      setConfirmCancel(null);
      const paid = Number(record.deposit_amount || 0) > 0;
      setResultPopup({
        type: 'success',
        message:
          `ยกเลิกคำขอยืม "${record.item_name}" สำเร็จแล้ว` +
          (paid ? `\nหากชำระค่ามัดจำแล้ว กรุณาติดต่อผู้ดูแลหอพักเพื่อขอรับเงินคืน` : ''),
      });
      await loadRecords();
    } catch (err) {
      setConfirmCancel(null);
      setResultPopup({ type: 'error', message: err.response?.data?.error || 'ยกเลิกคำขอไม่สำเร็จ' });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>ประวัติการยืม-คืน</h2>
      <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px 0' }}>รายการอุปกรณ์ที่คุณเคยยืมทั้งหมด</p>

      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {errorMsg}
        </div>
      )}

      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' }}>
        {loading && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            กำลังโหลดข้อมูล...
          </div>
        )}
        {!loading && records.length === 0 && !errorMsg && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            ยังไม่มีประวัติการยืม
          </div>
        )}
        {!loading &&
          records.map((r, i) => {
            const st = STATUS[r.status] || { label: r.status, bg: '#f1f5f9', color: '#475569' };
            const deposit = Number(r.deposit_amount || 0);
            const overdue = isOverdue(r);
            return (
              <div
                key={r.borrow_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderTop: i === 0 ? 'none' : '1px solid #f1f5f9',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14.5px' }}>{r.item_name}</div>
                  <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '3px' }}>
                    ยืมเมื่อ {formatDate(r.borrow_date)}
                    {r.return_date ? ` · คืนเมื่อ ${formatDate(r.return_date)}` : ''}
                  </div>
                  {/* กำหนดคืน (แสดงเฉพาะที่ยังไม่คืน) */}
                  {r.due_date && r.status !== 'returned' && (
                    <div
                      style={{
                        fontSize: '12.5px',
                        marginTop: '3px',
                        color: overdue ? '#dc2626' : '#64748b',
                        fontWeight: overdue ? 700 : 400,
                      }}
                    >
                      กำหนดคืน {formatDate(r.due_date)}
                      {overdue && ' (เกินกำหนด กรุณานำอุปกรณ์มาคืน)'}
                    </div>
                  )}
                  <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '3px' }}>
                    {deposit > 0 ? `ค่ามัดจำ ${deposit.toLocaleString('th-TH')} บาท` : 'ไม่มีค่ามัดจำ'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                  {r.status === 'pending' && (
                    <button
                      onClick={() => setConfirmCancel(r)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: '#dc2626',
                        backgroundColor: '#fee2e2',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      ยกเลิก
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* ป๊อปอัปยืนยันก่อนยกเลิกคำขอยืม */}
      {confirmCancel && (
        <ConfirmPopup
          type="confirm"
          title="ยกเลิกคำขอยืม"
          message={
            `ต้องการยกเลิกคำขอยืม "${confirmCancel.item_name}" ใช่หรือไม่?` +
            (Number(confirmCancel.deposit_amount || 0) > 0
              ? `\nค่ามัดจำที่โอนแล้วต้องติดต่อผู้ดูแลหอพักเพื่อขอรับเงินคืน`
              : '')
          }
          confirmText="ยืนยันยกเลิก"
          cancelText="ไม่ยกเลิก"
          busy={cancelling}
          onConfirm={handleConfirmCancel}
          onCancel={() => setConfirmCancel(null)}
        />
      )}

      {/* ป๊อปอัปแจ้งผลลัพธ์ */}
      {resultPopup && (
        <ConfirmPopup
          type={resultPopup.type}
          title={resultPopup.type === 'success' ? 'สำเร็จ' : 'เกิดข้อผิดพลาด'}
          message={resultPopup.message}
          onClose={() => setResultPopup(null)}
        />
      )}
    </div>
  );
}

export default TenantHistory;