import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PaymentInfoBox from './PaymentInfoBox';

const API_BASE = 'http://localhost:5000';
const BLUE = '#2955a8';
const BLUE_LIGHT = '#2f6fed';
const MAX_BORROW_DAYS = 30; // ต้องตรงกับ MAX_BORROW_DAYS ใน server.js
const MAX_SLIP_MB = 5;

const pad = (n) => String(n).padStart(2, '0');
const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const labelStyle = { display: 'block', fontSize: '13.5px', fontWeight: 600, color: BLUE, marginBottom: '7px' };
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

/**
 * หน้าต่างยืมอุปกรณ์ของผู้เช่า
 * props:
 *   item      - แถวจาก GET /api/items (ต้องมี item_id, item_name, image, next_deposit)
 *   tenantId  - id ของผู้เช่าที่ล็อกอินอยู่
 *   onClose   - ปิดหน้าต่าง
 *   onSuccess - เรียกหลังส่งคำขอสำเร็จ: onSuccess(message)
 *   onConflict - เรียกเมื่อของหมด/ค่ามัดจำเปลี่ยนระหว่างกรอก: onConflict(message)
 *               (หน้าหลักควรปิด modal โหลดรายการใหม่ แล้วแจ้งผู้เช่า)
 */
function BorrowItemModal({ item, tenantId, onClose, onSuccess, onConflict }) {
  const today = new Date();
  const minDate = toYMD(today);
  const maxDate = toYMD(addDays(today, MAX_BORROW_DAYS));

  const deposit = Number(item.next_deposit || 0);
  const needSlip = deposit > 0;

  const [returnDate, setReturnDate] = useState(toYMD(addDays(today, 7)));
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

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

  const handleSlipChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorText('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }
    if (file.size > MAX_SLIP_MB * 1024 * 1024) {
      setErrorText(`ไฟล์สลิปต้องมีขนาดไม่เกิน ${MAX_SLIP_MB} MB`);
      return;
    }
    setErrorText('');
    setSlipFile(file);
  };

  // จำนวนวันที่ยืม (นับจากวันนี้)
  const borrowDays = (() => {
    if (!returnDate) return null;
    const [y, m, d] = returnDate.split('-').map(Number);
    const ret = new Date(y, m - 1, d);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.round((ret - start) / 86400000);
  })();
  const dateValid = borrowDays !== null && borrowDays >= 0 && borrowDays <= MAX_BORROW_DAYS;

  const handleSubmit = async () => {
    setErrorText('');
    if (!dateValid) {
      setErrorText(`กรุณาเลือกวันที่คืนภายใน ${MAX_BORROW_DAYS} วันนับจากวันนี้`);
      return;
    }
    if (needSlip && !slipFile) {
      setErrorText('กรุณาแนบสลิปหลักฐานการชำระค่ามัดจำ');
      return;
    }

    const formData = new FormData();
    formData.append('tenant_id', tenantId);
    formData.append('item_id', item.item_id);
    formData.append('return_date', returnDate);
    formData.append('expected_deposit', deposit);
    if (slipFile) formData.append('slip', slipFile); // ชื่อ field ต้องเป็น "slip"

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/api/borrow`, formData);
      onSuccess?.(res.data.message || 'ส่งคำขอยืมสำเร็จ');
    } catch (err) {
      const message = err.response?.data?.error || 'ส่งคำขอยืมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      if (err.response?.status === 409) {
        // ของหมด หรือค่ามัดจำเปลี่ยน -> ให้หน้าหลักปิด modal แล้วโหลดรายการใหม่
        onConflict?.(message);
      } else {
        setErrorText(message); // ข้อผิดพลาดอื่น เช่น สลิปไม่ถูกต้อง / เน็ตหลุด -> อยู่ใน modal เดิม ไม่ต้องแนบสลิปใหม่
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={() => !submitting && onClose()}
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
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '22px 28px',
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
            {item.image ? (
              <img src={item.image} alt={item.item_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              '📦'
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: 0 }}>ยืม {item.item_name}</h2>
            <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.75)', margin: '3px 0 0 0' }}>
              ยืมได้ไม่เกิน {MAX_BORROW_DAYS} วัน
            </p>
          </div>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* วันที่คืน */}
          <div>
            <label style={labelStyle}>วันที่จะคืนอุปกรณ์</label>
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              style={inputStyle}
            />
            <p style={{ fontSize: '12px', color: dateValid ? '#64748b' : '#dc2626', margin: '6px 0 0 0' }}>
              {dateValid
                ? `ยืมประมาณ ${borrowDays} วัน (เลือกได้ถึง ${MAX_BORROW_DAYS} วันนับจากวันนี้)`
                : `กรุณาเลือกวันที่ภายใน ${MAX_BORROW_DAYS} วันนับจากวันนี้`}
            </p>
          </div>

          {/* ค่ามัดจำ */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>ค่ามัดจำ</span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: needSlip ? BLUE : '#059669' }}>
                {needSlip ? `${deposit.toLocaleString()} บาท` : 'ไม่มีค่ามัดจำ'}
              </span>
            </div>

            {needSlip && (
              <div style={{ marginTop: '12px' }}>
                <PaymentInfoBox title="โอนค่ามัดจำมาที่" note="คืนเงินมัดจำให้เมื่อคืนอุปกรณ์ในสภาพเรียบร้อย" />
              </div>
            )}
          </div>

          {/* แนบสลิป */}
          {needSlip && (
            <div>
              <label style={labelStyle}>แนบสลิปการโอนเงิน</label>
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
                      cursor: 'pointer',
                    }}
                  >
                    {slipFile ? 'เปลี่ยนรูปสลิป' : 'เลือกรูปสลิป'}
                    <input type="file" accept="image/*" onChange={handleSlipChange} style={{ display: 'none' }} />
                  </label>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0 0 0' }}>
                    รองรับไฟล์รูปภาพ ขนาดไม่เกิน {MAX_SLIP_MB} MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {errorText && (
            <div style={{ padding: '10px 14px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '10px', fontSize: '13.5px' }}>
              {errorText}
            </div>
          )}

          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            หลังส่งคำขอ แอดมินจะตรวจสลิปและอนุมัติ คุณดูสถานะได้ในประวัติการยืม-คืน
          </p>
        </div>

        {/* ปุ่ม */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '0 28px 26px 28px' }}>
          <button
            onClick={onClose}
            disabled={submitting}
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
            onClick={handleSubmit}
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
            {submitting ? 'กำลังส่งคำขอ...' : 'ส่งคำขอยืม'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BorrowItemModal;