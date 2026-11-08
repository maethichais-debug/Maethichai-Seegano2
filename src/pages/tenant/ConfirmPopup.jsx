import React from 'react';

const BLUE_LIGHT = '#2f6fed';

const successIcon = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00915a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const errorIcon = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const questionIcon = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2955a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// type: 'confirm' (สองปุ่ม) | 'success' | 'error' (ปุ่มเดียว "ตกลง")
function ConfirmPopup({ type, title, message, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก', onConfirm, onCancel, onClose, busy }) {
  const isConfirm = type === 'confirm';
  const icon = type === 'success' ? successIcon : type === 'error' ? errorIcon : questionIcon;
  const iconBg = type === 'success' ? '#dcf5e6' : type === 'error' ? '#fee2e2' : '#e0eaff';
  const closeHandler = isConfirm ? (busy ? undefined : onCancel) : onClose;

  return (
    <div
      onClick={closeHandler}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15,23,42,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '340px',
          padding: '28px',
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(15,23,42,0.3)',
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          {icon}
        </div>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>{title}</h3>
        <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 22px 0', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
          {message}
        </p>

        {isConfirm ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onCancel}
              disabled={busy}
              style={{
                flex: 1,
                padding: '11px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#475569',
                backgroundColor: '#f1f5f9',
                border: 'none',
                borderRadius: '10px',
                cursor: busy ? 'default' : 'pointer',
                opacity: busy ? 0.7 : 1,
              }}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              style={{
                flex: 1,
                padding: '11px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: BLUE_LIGHT,
                border: 'none',
                borderRadius: '10px',
                cursor: busy ? 'default' : 'pointer',
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? 'กำลังดำเนินการ...' : confirmText}
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '11px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: type === 'success' ? '#00b16a' : '#165fa3',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            ตกลง
          </button>
        )}
      </div>
    </div>
  );
}

export default ConfirmPopup;