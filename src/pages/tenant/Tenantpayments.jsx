import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ConfirmPopup from './ConfirmPopup';
import PaymentInfoBox from './PaymentInfoBox';

const API_BASE = 'http://localhost:5000';
const BLUE = '#2955a8';
const BLUE_LIGHT = '#2f6fed';
const MAX_SLIP_MB = 5;

// กติกาค่าปรับ (ต้องตรงกับ RENT_CYCLE_DAYS / RENT_GRACE_DAYS / LATE_FEE_PER_DAY ใน server.js)
const CYCLE_DAYS = 30;
const GRACE_DAYS = 3;
const LATE_FEE_PER_DAY = 50;

const STATUS = {
  unpaid: { label: 'ค้างชำระ', bg: '#fee2e2', color: '#dc2626' },
  pending: { label: 'รอตรวจสอบ', bg: '#fef3c7', color: '#b45309' },
  paid: { label: 'ชำระแล้ว', bg: '#d1fae5', color: '#059669' },
};

const TYPE_LABEL = { rent: 'ค่าเช่าเดือน', deposit: 'เงินมัดจำอุปกรณ์' };

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function formatMonth(value) {
  if (!value) return '—';
  const [y, m] = value.split('-');
  const monthIndex = parseInt(m, 10) - 1;
  if (!THAI_MONTHS[monthIndex]) return value;
  return `${THAI_MONTHS[monthIndex]} ${y}`;
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
  if (value === null || value === undefined) return '—';
  return Number(value).toLocaleString('th-TH');
}

const pad = (n) => String(n).padStart(2, '0');
// ค่าสำหรับช่อง datetime-local (YYYY-MM-DDTHH:mm)
const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

// จำนวนวันที่เลยกำหนด ณ วันที่ atDate (0 ถ้าไม่เกินกำหนด)
function lateDaysAt(deadlineYMD, atDate) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(deadlineYMD || ''));
  if (!m || !atDate || Number.isNaN(atDate.getTime())) return 0;
  const dl = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const day = new Date(atDate.getFullYear(), atDate.getMonth(), atDate.getDate());
  return Math.max(0, Math.round((day - dl) / 86400000));
}

function billTitle(bill) {
  const label = TYPE_LABEL[bill.payment_type] || TYPE_LABEL.rent;
  return `${label} ${formatMonth(bill.payment_month)}`;
}

function TenantPayments({ user }) {
  const [lease, setLease] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [resultPopup, setResultPopup] = useState(null); // { type: 'success' | 'error', message }

  // ===== หน้าต่างโอนเงิน + แนบสลิป =====
  const [payingBill, setPayingBill] = useState(null); // บิลที่กำลังแนบสลิป
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState('');
  const [transferAt, setTransferAt] = useState(''); // วัน-เวลาที่โอน (รูปแบบ datetime-local)
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadData = async () => {
    try {
      const [summaryRes, billsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/tenant/${user.id}/summary`),
        axios.get(`${API_BASE}/api/tenant/${user.id}/payments`),
      ]);
      setLease(summaryRes.data.lease);
      setBills(billsRes.data);
    } catch (err) {
      setErrorMsg('โหลดข้อมูลการเงินไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  // สร้างรูปตัวอย่างสลิป และคืนหน่วยความจำเมื่อเปลี่ยนไฟล์/ปิดหน้าต่าง
  useEffect(() => {
    if (!slipFile) {
      setSlipPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(slipFile);
    setSlipPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [slipFile]);

  const openPayModal = (bill) => {
    setPayingBill(bill);
    setSlipFile(null);
    setTransferAt(toLocalInput(new Date())); // ค่าเริ่มต้น = ตอนนี้ แก้ได้ถ้าโอนไปก่อนหน้านั้น
    setModalError('');
  };

  const closePayModal = () => {
    if (submitting) return;
    setPayingBill(null);
    setSlipFile(null);
    setModalError('');
  };

  const handleSlipChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // เคลียร์ค่า เผื่อเลือกไฟล์เดิมซ้ำได้
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setModalError('กรุณาเลือกไฟล์รูปภาพเท่านั้น (jpg, png)');
      return;
    }
    if (file.size > MAX_SLIP_MB * 1024 * 1024) {
      setModalError(`ไฟล์สลิปต้องมีขนาดไม่เกิน ${MAX_SLIP_MB} MB`);
      return;
    }
    setModalError('');
    setSlipFile(file);
  };

  // ค่าปรับตามวัน-เวลาที่โอนที่เลือกอยู่ในหน้าต่าง
  const chosenDate = transferAt ? new Date(transferAt) : null;
  const chosenValid = chosenDate && !Number.isNaN(chosenDate.getTime());
  const modalLateDays = payingBill && chosenValid ? lateDaysAt(payingBill.deadline, chosenDate) : 0;
  const modalFee = modalLateDays * LATE_FEE_PER_DAY;
  const modalTotal = payingBill ? Number(payingBill.amount || 0) + modalFee : 0;

  const handleSubmitSlip = async () => {
    if (!chosenValid) {
      setModalError('กรุณาระบุวันและเวลาที่โอนเงิน');
      return;
    }
    if (chosenDate.getTime() > Date.now() + 5 * 60 * 1000) {
      setModalError('วันและเวลาที่โอนต้องไม่เป็นเวลาในอนาคต');
      return;
    }
    if (!slipFile) {
      setModalError('กรุณาเลือกรูปสลิปการโอนเงิน');
      return;
    }
    setModalError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('transfer_at', transferAt); // เช่น 2026-11-02T14:30
      formData.append('slip', slipFile); // ชื่อ field ต้องเป็น "slip"
      const res = await axios.put(`${API_BASE}/api/tenant/${user.id}/payments/${payingBill.transaction_id}/slip`, formData);

      setPayingBill(null);
      setSlipFile(null);
      const fee = Number(res.data?.late_fee || 0);
      setResultPopup({
        type: 'success',
        message:
          'แนบสลิปสำเร็จแล้ว รอผู้ดูแลหอพักตรวจสอบและยืนยันการชำระเงิน' +
          (fee > 0 ? `\nมีค่าปรับล่าช้า ${formatMoney(fee)} บาท (${res.data.late_days} วัน)` : ''),
      });
      await loadData();
    } catch (err) {
      const message = err.response?.data?.error || 'แนบสลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      if (err.response?.status === 404) {
        // ไม่พบบิล หรือบิลถูกยืนยันไปแล้ว -> ปิดหน้าต่าง แจ้งผล และโหลดรายการใหม่
        setPayingBill(null);
        setSlipFile(null);
        setResultPopup({ type: 'error', message });
        await loadData();
      } else {
        setModalError(message); // ข้อผิดพลาดอื่น (เน็ตหลุด ฯลฯ) อยู่ในหน้าต่างเดิม ไม่ต้องเลือกสลิปใหม่
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>การเงิน</h2>
      <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px 0' }}>
        ตรวจสอบค่าเช่า โอนเงินตามบัญชีที่แจ้ง แล้วแนบหลักฐานการโอนสำหรับบิลที่ค้างชำระ
      </p>

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

      {loading && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          กำลังโหลดข้อมูล...
        </div>
      )}

      {!loading && !errorMsg && (
        <>
          {/* ========== เงื่อนไขการชำระค่าเช่า ========== */}
          <div
            style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '14px',
              padding: '16px 20px',
              marginBottom: '20px',
              fontSize: '13.5px',
              color: BLUE,
              lineHeight: 1.7,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>เงื่อนไขการชำระค่าเช่า</div>
            <div>
              เมื่ออยู่ครบ {CYCLE_DAYS} วัน จะมีเวลาโอนอีก {GRACE_DAYS} วัน กรุณาโอนภายในวันที่กำหนด
              หากโอนช้ากว่านั้น จะคิดค่าปรับล่าช้า <b>วันละ ฿{LATE_FEE_PER_DAY}</b> นับจากวันแรกที่เลยกำหนดจนถึงวันที่โอน
            </div>
          </div>

          {/* ========== สรุปค่าเช่า/เงินมัดจำของห้องปัจจุบัน ========== */}
          {lease && (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '20px 22px',
                boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
                marginBottom: '20px',
                display: 'flex',
                gap: '32px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 600 }}>ค่าเช่าต่อเดือน</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                  ฿{formatMoney(lease.price)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 600 }}>เงินมัดจำที่วางไว้</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                  ฿{formatMoney(lease.deposit)}
                </div>
              </div>
            </div>
          )}

          {/* ========== รายการบิลทั้งหมด ========== */}
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px 0' }}>รายการค่าเช่า</h3>

          {bills.length === 0 && (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '24px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '14px',
                boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
              }}
            >
              ยังไม่มีรายการบิล
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bills.map((bill) => {
              const st = STATUS[bill.payment_status] || { label: bill.payment_status, bg: '#f1f5f9', color: '#475569' };
              const canUpload = bill.payment_status !== 'paid';
              const isUnpaid = bill.payment_status === 'unpaid';
              const rejected = isUnpaid && bill.reject_reason;
              const lateToday = Number(bill.late_days_today || 0);

              return (
                <div
                  key={bill.transaction_id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    padding: '18px 22px',
                    boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14.5px' }}>{billTitle(bill)}</div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>
                        ฿{formatMoney(bill.amount)}
                        {bill.payment_status === 'paid' && bill.payment_date && ` · ชำระเมื่อ ${formatDate(bill.payment_date)}`}
                        {bill.payment_status === 'paid' && Number(bill.late_fee) > 0 && ` · รวมค่าปรับล่าช้า ฿${formatMoney(bill.late_fee)}`}
                      </div>

                      {/* กำหนดโอน (เฉพาะบิลที่ยังไม่ชำระ และคำนวณรอบได้) */}
                      {canUpload && bill.deadline && (
                        <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px' }}>
                          ครบ {CYCLE_DAYS} วันวันที่ {formatYMD(bill.cycle_end)} · โอนภายในวันที่{' '}
                          <b style={{ color: '#0f172a' }}>{formatYMD(bill.deadline)}</b>
                        </div>
                      )}

                      {/* เกินกำหนดแล้ว และยังไม่ได้แนบสลิป */}
                      {isUnpaid && lateToday > 0 && (
                        <div style={{ fontSize: '12.5px', color: '#dc2626', fontWeight: 600, marginTop: '3px' }}>
                          เกินกำหนด {lateToday} วัน · ค่าปรับสะสมถึงวันนี้ ฿{formatMoney(bill.late_fee_today)}
                        </div>
                      )}

                      {/* แนบสลิปแล้ว รอตรวจสอบ */}
                      {bill.payment_status === 'pending' && bill.transfer_at && (
                        <div style={{ fontSize: '12.5px', color: '#b45309', marginTop: '3px' }}>
                          แจ้งโอนเมื่อ {formatDateTime(bill.transfer_at)}
                          {Number(bill.late_fee) > 0 && ` · ค่าปรับล่าช้า ฿${formatMoney(bill.late_fee)}`}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {bill.evidence_path && (
                        <a href={`${API_BASE}${bill.evidence_path}`} target="_blank" rel="noopener noreferrer">
                          <img
                            src={`${API_BASE}${bill.evidence_path}`}
                            alt="สลิปที่แนบไว้"
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              border: '1px solid #e2e8f0',
                            }}
                          />
                        </a>
                      )}

                      <span
                        style={{
                          backgroundColor: st.bg,
                          color: st.color,
                          fontSize: '12.5px',
                          fontWeight: 600,
                          padding: '4px 12px',
                          borderRadius: '999px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {st.label}
                      </span>

                      {canUpload && (
                        <button
                          onClick={() => openPayModal(bill)}
                          style={{
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#ffffff',
                            backgroundColor: BLUE_LIGHT,
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {bill.evidence_path ? 'แนบสลิปใหม่' : 'ชำระเงิน / แนบสลิป'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* แอดมินปฏิเสธสลิป -> แจ้งเหตุผลให้โอน/แนบใหม่ */}
                  {rejected && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '10px 14px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '10px',
                        fontSize: '13px',
                        color: '#b91c1c',
                        lineHeight: 1.6,
                      }}
                    >
                      <b>สลิปไม่ผ่านการตรวจสอบ:</b> {bill.reject_reason}
                      <div style={{ color: '#dc2626', marginTop: '2px' }}>กรุณาโอนให้ถูกต้องแล้วแนบสลิปใหม่</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '14px 0 0 0' }}>
            หลังแนบสลิปแล้ว สถานะจะเปลี่ยนเป็น "รอตรวจสอบ" จนกว่าผู้ดูแลหอพักจะยืนยันการชำระเงิน
          </p>
        </>
      )}

      {/* ========== หน้าต่างโอนเงิน + แนบสลิป ========== */}
      {payingBill && (
        <div
          onClick={closePayModal}
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
            {/* หัว modal */}
            <div
              style={{
                padding: '22px 28px',
                background: `linear-gradient(100deg, ${BLUE_LIGHT} 0%, ${BLUE} 100%)`,
                borderRadius: '18px 18px 0 0',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                ชำระ{billTitle(payingBill)}
              </h2>
              <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.75)', margin: '3px 0 0 0' }}>
                โอนเงินตามบัญชีด้านล่าง แล้วแนบสลิปให้ผู้ดูแลหอพักตรวจสอบ
              </p>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* ยอดที่ต้องโอน + บัญชีรับโอน */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ค่าเช่า</span>
                    <b style={{ color: '#0f172a' }}>฿{formatMoney(payingBill.amount)}</b>
                  </div>
                  {modalFee > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                      <span>ค่าปรับล่าช้า {modalLateDays} วัน × ฿{LATE_FEE_PER_DAY}</span>
                      <b>฿{formatMoney(modalFee)}</b>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #e2e8f0',
                    marginTop: '8px',
                    paddingTop: '10px',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>ยอดที่ต้องโอน</span>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: BLUE }}>{formatMoney(modalTotal)} บาท</span>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <PaymentInfoBox
                    title="โอนมาที่"
                    note="โอนให้ตรงยอด แล้วแนบสลิปที่เห็นยอดเงินและวันเวลาชัดเจน"
                  />
                </div>
              </div>

              {/* เตือนเรื่องกำหนดโอน */}
              {payingBill.deadline && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '12.5px',
                    lineHeight: 1.6,
                    backgroundColor: modalLateDays > 0 ? '#fef2f2' : '#f0fdf4',
                    color: modalLateDays > 0 ? '#b91c1c' : '#166534',
                  }}
                >
                  {modalLateDays > 0
                    ? `โอนเกินกำหนดแล้ว ${modalLateDays} วัน (กำหนดโอนภายในวันที่ ${formatYMD(payingBill.deadline)}) ค่าปรับวันละ ฿${LATE_FEE_PER_DAY}`
                    : `โอนภายในวันที่ ${formatYMD(payingBill.deadline)} จะไม่มีค่าปรับ หลังจากนั้นปรับวันละ ฿${LATE_FEE_PER_DAY}`}
                </div>
              )}

              {/* กรณีเคยแนบสลิปไว้แล้ว */}
              {payingBill.evidence_path && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    backgroundColor: '#fffbeb',
                    borderRadius: '10px',
                    fontSize: '12.5px',
                    color: '#b45309',
                  }}
                >
                  <a href={`${API_BASE}${payingBill.evidence_path}`} target="_blank" rel="noopener noreferrer">
                    <img
                      src={`${API_BASE}${payingBill.evidence_path}`}
                      alt="สลิปเดิม"
                      style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #fde68a', display: 'block' }}
                    />
                  </a>
                  <span>คุณเคยแนบสลิปไว้แล้ว (รอตรวจสอบ) การแนบใหม่จะแทนที่สลิปเดิม</span>
                </div>
              )}

              {/* วัน-เวลาที่โอน */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: BLUE, marginBottom: '7px' }}>
                  วัน-เวลาที่โอนเงิน
                </label>
                <input
                  type="datetime-local"
                  value={transferAt}
                  max={toLocalInput(new Date())}
                  onChange={(e) => setTransferAt(e.target.value)}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    fontSize: '14px',
                    border: '1px solid #dbe3ef',
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0 0' }}>
                  กรอกตามเวลาที่โอนจริงในสลิป ระบบคิดค่าปรับจากวันที่โอน และผู้ดูแลจะตรวจเทียบกับสลิป
                </p>
              </div>

              {/* แนบสลิป */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: BLUE, marginBottom: '7px' }}>
                  แนบสลิปการโอนเงิน
                </label>
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
                    {slipPreview ? (
                      <img src={slipPreview} alt="ตัวอย่างสลิป" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      '🧾'
                    )}
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: BLUE,
                        backgroundColor: '#e8eefb',
                        borderRadius: '10px',
                        cursor: submitting ? 'default' : 'pointer',
                      }}
                    >
                      {slipFile ? 'เปลี่ยนรูปสลิป' : 'เลือกรูปสลิป'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSlipChange}
                        disabled={submitting}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0 0 0' }}>
                      รองรับไฟล์รูปภาพ ขนาดไม่เกิน {MAX_SLIP_MB} MB
                    </p>
                  </div>
                </div>
              </div>

              {modalError && (
                <div style={{ padding: '10px 14px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '10px', fontSize: '13.5px' }}>
                  {modalError}
                </div>
              )}
            </div>

            {/* ปุ่ม */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '0 28px 26px 28px' }}>
              <button
                onClick={closePayModal}
                disabled={submitting}
                style={{
                  padding: '11px 22px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#475569',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: submitting ? 'default' : 'pointer',
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmitSlip}
                disabled={submitting}
                style={{
                  padding: '11px 22px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: BLUE_LIGHT,
                  border: 'none',
                  borderRadius: '10px',
                  cursor: submitting ? 'default' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'กำลังส่งสลิป...' : 'ส่งสลิปให้ตรวจสอบ'}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default TenantPayments;