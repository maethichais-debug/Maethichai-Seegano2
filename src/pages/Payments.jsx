import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PopupModal from '../components/PopupModal';

const API_BASE = 'http://localhost:5000';
const BLUE = '#2955a8';
const BLUE_LIGHT = '#2f6fed';

const STATUS_BADGE = {
  paid: { label: 'ชำระแล้ว', bg: '#d1fae5', color: '#059669' },
  pending: { label: 'รอตรวจสอบ', bg: '#fef3c7', color: '#d97706' },
  unpaid: { label: 'ค้างชำระ', bg: '#fee2e2', color: '#ef4444' },
};

const TYPE_LABEL = { rent: 'ค่าเช่าห้อง', deposit: 'เงินมัดจำอุปกรณ์' };

// เหตุผลที่ใช้บ่อย กดแล้วเติมลงช่องเหตุผลให้
const REJECT_REASONS = [
  'ยอดเงินไม่ตรง',
  'รูปสลิปไม่ชัดเจน',
  'ไม่ใช่สลิปการโอนเงิน',
  'วันเวลาที่โอนไม่ตรงกับที่แจ้ง',
];

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

// payment_month เก็บเป็น 'YYYY-MM' (เช่น '2026-10') แปลงเป็น "ตุลาคม 2026" ตอนแสดงผล
function formatMonth(value) {
  if (!value) return '—';
  const [year, month] = value.split('-');
  const idx = parseInt(month, 10) - 1;
  if (!THAI_MONTHS[idx]) return value;
  return `${THAI_MONTHS[idx]} ${year}`;
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

// วันที่แบบ YYYY-MM-DD (เช่น กำหนดโอน) แปลงเองกันปัญหา timezone
function formatYMD(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  if (!m) return '—';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

// วัน-เวลาจาก backend รูปแบบ 'YYYY-MM-DD HH:mm:ss'
function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time} น.`;
}

function formatMoney(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString('th-TH');
}

// ค่าปรับที่เกี่ยวข้องกับแถวนี้: ถ้ายังค้างชำระ = ค่าปรับสะสมถึงวันนี้ ถ้าแนบสลิป/ชำระแล้ว = ค่าปรับตามวันที่โอน
function feeOf(item) {
  return item.payment_status === 'unpaid' ? Number(item.late_fee_today || 0) : Number(item.late_fee || 0);
}

// คอลัมน์ของตาราง: ห้อง/ผู้เช่า | ประเภท | รอบเดือน | จำนวนเงิน | วันที่โอน/ชำระ | สถานะ | จัดการ
const GRID_COLS = '1.6fr 1.1fr 1.1fr 1.3fr 1.4fr 1fr 1.6fr';

const smallBtn = (color, bg, disabled) => ({
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

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actingId, setActingId] = useState(null); // รายการที่กำลังกดอนุมัติ (กันกดซ้ำ)
  const [viewingSlip, setViewingSlip] = useState(null); // รายการที่กำลังเปิดดูรูปสลิป (item object) | null

  // ===== หน้าต่าง "สลิปไม่ถูกต้อง" =====
  const [rejecting, setRejecting] = useState(null); // รายการที่กำลังปฏิเสธสลิป
  const [rejectReason, setRejectReason] = useState('');
  const [rejectBusy, setRejectBusy] = useState(false);
  const [rejectError, setRejectError] = useState('');

  // popup: { type: 'success' | 'error' | 'confirm', title, message, onConfirm }
  const [popup, setPopup] = useState(null);

  const loadPayments = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.get(`${API_BASE}/api/payments`);
      setPayments(res.data);
    } catch (err) {
      setErrorMsg('โหลดข้อมูลการชำระเงินไม่สำเร็จ ตรวจสอบว่า backend เปิดอยู่หรือไม่');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const runApprove = async (id) => {
    setActingId(id);
    try {
      await axios.put(`${API_BASE}/api/payments/${id}/approve`);
      await loadPayments();
    } catch (err) {
      setPopup({ type: 'error', title: 'ดำเนินการไม่สำเร็จ', message: err.response?.data?.error || 'เกิดข้อผิดพลาด' });
    } finally {
      setActingId(null);
    }
  };

  const askApprove = (item) => {
    const fee = feeOf(item);
    const total = Number(item.amount || 0) + fee;
    setPopup({
      type: 'confirm',
      title: 'ยืนยันการชำระเงิน',
      message:
        `ยืนยันว่า ${item.first_name} ${item.last_name} (ห้อง ${item.room_number}) ชำระเงินแล้ว ใช่หรือไม่?\n` +
        `ยอดที่ควรได้รับ ${formatMoney(total)} บาท` +
        (fee > 0 ? ` (ค่าเช่า ${formatMoney(item.amount)} + ค่าปรับล่าช้า ${formatMoney(fee)})` : ''),
      confirmText: 'ยืนยัน',
      onConfirm: () => {
        setPopup(null);
        runApprove(item.transaction_id);
      },
    });
  };

  const openReject = (item) => {
    setRejecting(item);
    setRejectReason('');
    setRejectError('');
  };

  const closeReject = () => {
    if (rejectBusy) return;
    setRejecting(null);
  };

  const submitReject = async () => {
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError('กรุณาระบุเหตุผลที่สลิปไม่ถูกต้อง เพื่อให้ผู้เช่าทราบ');
      return;
    }
    setRejectError('');
    setRejectBusy(true);
    try {
      await axios.put(`${API_BASE}/api/payments/${rejecting.transaction_id}/reject-slip`, { reason });
      setRejecting(null);
      await loadPayments();
    } catch (err) {
      setRejectError(err.response?.data?.error || 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setRejectBusy(false);
    }
  };

  // สรุปภาพรวม คำนวณจากข้อมูลจริงที่โหลดมา
  const paidCount = payments.filter((p) => p.payment_status === 'paid').length;
  const pendingCount = payments.filter((p) => p.payment_status === 'pending').length;
  const unpaidTotal = payments.filter((p) => p.payment_status === 'unpaid').reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: 0 }}>การเงิน</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
          ระบบสร้างบิลค่าเช่าของเดือนนี้ให้อัตโนมัติทุกห้องที่มีผู้เช่าอยู่ — แค่ตรวจสลิปแล้วกดยืนยันเมื่อชำระถูกต้อง
        </p>
        <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '4px 0 0 0' }}>
          กติกา: อยู่ครบ 30 วันแล้วมีเวลาโอนอีก 3 วัน หลังจากนั้นคิดค่าปรับล่าช้าวันละ ฿50 (คิดจากวันที่ผู้เช่าแจ้งว่าโอน)
        </p>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>
          {errorMsg}
        </div>
      )}

      {/* การ์ดสรุปภาพรวม */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>ชำระแล้ว</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#059669', marginTop: '4px' }}>{paidCount} รายการ</div>
        </div>
        <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>รอตรวจสอบ</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#d97706', marginTop: '4px' }}>{pendingCount} รายการ</div>
        </div>
        <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>ยอดค้างชำระรวม</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>฿{formatMoney(unpaidTotal)}</div>
        </div>
      </div>

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
          <span>ห้อง / ผู้เช่า</span>
          <span>ประเภท</span>
          <span>รอบเดือน</span>
          <span>จำนวนเงิน</span>
          <span>วัน-เวลาที่โอน / ชำระ</span>
          <span>สถานะ</span>
          <span>จัดการ</span>
        </div>

        {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>กำลังโหลดข้อมูล...</div>}

        {!loading && payments.length === 0 && !errorMsg && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            ยังไม่มีห้องที่มีผู้เช่าอยู่ — บิลจะขึ้นอัตโนมัติเมื่อมีสัญญาเช่า active
          </div>
        )}

        {!loading &&
          payments.map((item) => {
            const st = STATUS_BADGE[item.payment_status] || { label: item.payment_status, bg: '#f1f5f9', color: '#475569' };
            const busy = actingId === item.transaction_id;
            const fee = feeOf(item);
            return (
              <div
                key={item.transaction_id}
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
                <span>
                  <span style={{ fontWeight: 600, color: '#0f172a', display: 'block' }}>ห้อง {item.room_number}</span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    {item.first_name} {item.last_name}
                  </span>
                </span>
                <span>{TYPE_LABEL[item.payment_type] || item.payment_type}</span>
                <span>{formatMonth(item.payment_month)}</span>

                {/* จำนวนเงิน + ค่าปรับล่าช้า */}
                <span style={{ lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600, color: '#0f172a', display: 'block' }}>฿{formatMoney(item.amount)}</span>
                  {fee > 0 && (
                    <span style={{ fontSize: '12px', color: '#dc2626', display: 'block' }}>
                      {item.payment_status === 'unpaid'
                        ? `เกินกำหนด ${item.late_days_today} วัน · ปรับ ฿${formatMoney(fee)}`
                        : `+ ค่าปรับล่าช้า ฿${formatMoney(fee)}`}
                    </span>
                  )}
                </span>

                {/* วัน-เวลาที่โอน (ผู้เช่าแจ้ง) หรือวันที่ชำระ */}
                <span style={{ lineHeight: 1.5 }}>
                  {item.transfer_at ? (
                    <>
                      <span style={{ display: 'block' }}>{formatDateTime(item.transfer_at)}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>เวลาที่ผู้เช่าแจ้งว่าโอน</span>
                    </>
                  ) : item.payment_status === 'paid' ? (
                    formatDate(item.payment_date)
                  ) : (
                    '—'
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
                  {item.evidence_path && (
                    <button onClick={() => setViewingSlip(item)} style={smallBtn('#475569', '#f1f5f9', false)}>
                      ดูสลิป
                    </button>
                  )}
                  {item.payment_status !== 'paid' && (
                    <button disabled={busy} onClick={() => askApprove(item)} style={smallBtn('#ffffff', BLUE_LIGHT, busy)}>
                      ยืนยันชำระ
                    </button>
                  )}
                  {item.payment_status === 'pending' && item.evidence_path && (
                    <button disabled={busy} onClick={() => openReject(item)} style={smallBtn('#dc2626', '#fee2e2', busy)}>
                      สลิปไม่ถูกต้อง
                    </button>
                  )}
                </span>
              </div>
            );
          })}
      </div>

      {/* ========== Modal ดูรูปสลิปที่ผู้เช่าแนบมา ========== */}
      {viewingSlip && (
        <div
          onClick={() => setViewingSlip(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15,23,42,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 150,
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
              boxShadow: '0 24px 60px rgba(15,23,42,0.35)',
            }}
          >
            <div style={{ padding: '20px 24px 0 24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                สลิปการโอนเงิน — {viewingSlip.first_name} {viewingSlip.last_name}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                ห้อง {viewingSlip.room_number} · {TYPE_LABEL[viewingSlip.payment_type] || viewingSlip.payment_type} · {formatMonth(viewingSlip.payment_month)}
              </p>
            </div>

            <div style={{ padding: '16px 24px 0 24px' }}>
              <a href={`${API_BASE}${viewingSlip.evidence_path}`} target="_blank" rel="noopener noreferrer">
                <img
                  src={`${API_BASE}${viewingSlip.evidence_path}`}
                  alt="สลิปการโอนเงิน"
                  style={{ width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'block' }}
                />
              </a>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0 0' }}>คลิกที่รูปเพื่อเปิดดูขนาดเต็มในแท็บใหม่</p>
            </div>

            {/* รายละเอียดสำหรับเทียบกับสลิป */}
            <div
              style={{
                margin: '14px 24px 0 24px',
                padding: '14px 16px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '13px',
                color: '#475569',
                lineHeight: 1.9,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span>วัน-เวลาที่โอน (ผู้เช่าแจ้ง)</span>
                <b style={{ color: '#0f172a', textAlign: 'right' }}>{formatDateTime(viewingSlip.transfer_at)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span>แนบสลิปเข้าระบบเมื่อ</span>
                <b style={{ color: '#0f172a', textAlign: 'right' }}>{formatDateTime(viewingSlip.slip_uploaded_at)}</b>
              </div>
              {viewingSlip.deadline && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span>กำหนดโอนไม่เสียค่าปรับ</span>
                  <b style={{ color: '#0f172a' }}>ภายใน {formatYMD(viewingSlip.deadline)}</b>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span>ค่าเช่า</span>
                <b style={{ color: '#0f172a' }}>฿{formatMoney(viewingSlip.amount)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span>ค่าปรับล่าช้า</span>
                <b style={{ color: feeOf(viewingSlip) > 0 ? '#dc2626' : '#0f172a' }}>
                  ฿{formatMoney(feeOf(viewingSlip))}
                </b>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                  borderTop: '1px solid #e2e8f0',
                  marginTop: '4px',
                  paddingTop: '6px',
                }}
              >
                <span style={{ fontWeight: 600, color: '#0f172a' }}>ยอดที่ควรได้รับ</span>
                <b style={{ color: BLUE, fontSize: '15px' }}>฿{formatMoney(Number(viewingSlip.amount || 0) + feeOf(viewingSlip))}</b>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, marginTop: '4px' }}>
                วัน-เวลาที่โอนเป็นข้อมูลที่ผู้เช่ากรอก กรุณาเทียบกับวัน-เวลาและยอดเงินในสลิปก่อนยืนยัน
              </div>
            </div>

            <div style={{ padding: '16px 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {viewingSlip.payment_status === 'pending' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      const item = viewingSlip;
                      setViewingSlip(null);
                      openReject(item);
                    }}
                    style={{ ...smallBtn('#dc2626', '#fee2e2', false), flex: 1, padding: '11px', fontSize: '14px', borderRadius: '10px' }}
                  >
                    สลิปไม่ถูกต้อง
                  </button>
                  <button
                    onClick={() => {
                      const item = viewingSlip;
                      setViewingSlip(null);
                      askApprove(item);
                    }}
                    style={{ ...smallBtn('#ffffff', BLUE_LIGHT, false), flex: 1, padding: '11px', fontSize: '14px', borderRadius: '10px' }}
                  >
                    ยืนยันชำระ
                  </button>
                </div>
              )}
              <button
                onClick={() => setViewingSlip(null)}
                style={{ ...smallBtn('#475569', '#f1f5f9', false), width: '100%', padding: '11px', fontSize: '14px', borderRadius: '10px' }}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== Modal สลิปไม่ถูกต้อง (ส่งกลับให้ผู้เช่าโอนใหม่) ========== */}
      {rejecting && (
        <div
          onClick={closeReject}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15,23,42,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 160,
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
                padding: '22px 28px',
                background: `linear-gradient(100deg, ${BLUE_LIGHT} 0%, ${BLUE} 100%)`,
                borderRadius: '18px 18px 0 0',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: 0 }}>สลิปไม่ถูกต้อง</h2>
              <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.75)', margin: '3px 0 0 0' }}>
                ห้อง {rejecting.room_number} · {rejecting.first_name} {rejecting.last_name} · {formatMonth(rejecting.payment_month)}
              </p>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '13.5px', color: '#475569', margin: 0, lineHeight: 1.6 }}>
                บิลนี้จะกลับเป็น "ค้างชำระ" และสลิปเดิมจะถูกนำออก ผู้เช่าจะเห็นเหตุผลด้านล่างและแนบสลิปใหม่ได้
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: BLUE, marginBottom: '7px' }}>
                  เหตุผล
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {REJECT_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRejectReason(r)}
                      style={{
                        padding: '5px 12px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: rejectReason === r ? '#ffffff' : BLUE,
                        backgroundColor: rejectReason === r ? BLUE_LIGHT : '#e8eefb',
                        border: 'none',
                        borderRadius: '999px',
                        cursor: 'pointer',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  maxLength={255}
                  rows={3}
                  placeholder="พิมพ์เหตุผลที่สลิปไม่ถูกต้อง"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    border: '1px solid #dbe3ef',
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {rejectError && (
                <div style={{ padding: '10px 14px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '10px', fontSize: '13.5px' }}>
                  {rejectError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '0 28px 26px 28px' }}>
              <button
                onClick={closeReject}
                disabled={rejectBusy}
                style={{ ...smallBtn('#475569', '#f1f5f9', rejectBusy), padding: '11px 22px', fontSize: '14px', borderRadius: '10px' }}
              >
                ยกเลิก
              </button>
              <button
                onClick={submitReject}
                disabled={rejectBusy}
                style={{ ...smallBtn('#ffffff', BLUE_LIGHT, rejectBusy), padding: '11px 22px', fontSize: '14px', borderRadius: '10px' }}
              >
                {rejectBusy ? 'กำลังดำเนินการ...' : 'ส่งกลับให้ผู้เช่า'}
              </button>
            </div>
          </div>
        </div>
      )}

      <PopupModal
        open={!!popup}
        type={popup?.type}
        title={popup?.title}
        message={popup?.message}
        confirmText={popup?.confirmText || 'ตกลง'}
        onConfirm={popup?.onConfirm || (() => setPopup(null))}
        onCancel={() => setPopup(null)}
      />
    </div>
  );
}

export default Payments;