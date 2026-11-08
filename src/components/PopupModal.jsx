import React from 'react';

const BLUE = '#2955a8';
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

const confirmIcon = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ICONS = { success: successIcon, error: errorIcon, confirm: confirmIcon };
const ICON_BG = { success: '#dcf5e6', error: '#fee2e2', confirm: '#fef3c7' };

// popup กลางจอใช้ซ้ำได้ทั้งแอป — type: 'success' | 'error' | 'confirm'
function PopupModal({ open, type = 'success', title, message, confirmText = 'ตกลง', onConfirm, onCancel }) {
  if (!open) return null;

  const isConfirm = type === 'confirm';

  return (
    <div
      onClick={onCancel || onConfirm}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15,23,42,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '360px',
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
            backgroundColor: ICON_BG[type] || ICON_BG.success,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          {ICONS[type] || ICONS.success}
        </div>

        {title && <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>{title}</h3>}
        {message && <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 22px 0', lineHeight: 1.6 }}>{message}</p>}

        <div style={{ display: 'flex', gap: '10px' }}>
          {isConfirm && onCancel && (
            <button
              onClick={onCancel}
              style={{
                flex: 1,
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
              ยกเลิก
            </button>
          )}
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '11px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: type === 'error' ? '#dc2626' : type === 'confirm' ? '#b45309' : BLUE_LIGHT,
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PopupModal;