import React, { useState } from 'react';

// ===== แก้ข้อมูลบัญชีรับเงินของหอพักที่นี่ที่เดียว (ใช้ร่วมกันทั้งหน้ายืมอุปกรณ์และหน้าการเงิน) =====
export const PAYMENT_INFO = {
  bank: 'ธนาคาร ○○○○○',
  accountName: 'ชื่อบัญชี ○○○○○',
  accountNo: 'xxx-x-xxxxx-x',
};

const BLUE = '#2955a8';

/**
 * กล่องแสดงบัญชีที่ต้องโอนเงินไป พร้อมปุ่มคัดลอกเลขบัญชี
 * props:
 *   title - หัวข้อ เช่น "โอนค่ามัดจำมาที่" / "โอนค่าเช่ามาที่" (ไม่ใส่ = "โอนเงินมาที่")
 *   note  - ข้อความเล็กๆ ท้ายกล่อง (ไม่ใส่ก็ได้)
 */
function PaymentInfoBox({ title = 'โอนเงินมาที่', note }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // คัดลอกเฉพาะตัวเลข เพื่อเอาไปวางในแอปธนาคารได้เลย
      await navigator.clipboard.writeText(PAYMENT_INFO.accountNo.replace(/[^0-9]/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // เบราว์เซอร์ไม่อนุญาตให้คัดลอก ไม่ต้องทำอะไร ผู้ใช้ยังคัดลอกเองจากข้อความได้
    }
  };

  return (
    <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7 }}>
      <div>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, color: '#0f172a' }}>
          {PAYMENT_INFO.bank} · {PAYMENT_INFO.accountNo}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            padding: '3px 10px',
            fontSize: '12px',
            fontWeight: 600,
            color: copied ? '#059669' : BLUE,
            backgroundColor: copied ? '#d1fae5' : '#e8eefb',
            border: 'none',
            borderRadius: '999px',
            cursor: 'pointer',
          }}
        >
          {copied ? 'คัดลอกแล้ว' : 'คัดลอกเลขบัญชี'}
        </button>
      </div>
      <div>ชื่อบัญชี {PAYMENT_INFO.accountName}</div>
      {note && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{note}</div>}
    </div>
  );
}

export default PaymentInfoBox;