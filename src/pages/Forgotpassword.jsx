import React, { useState } from 'react';
import axios from 'axios';

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

const fieldWrapperStyle = { position: 'relative' };
const iconStyle = {
  position: 'absolute',
  left: '14px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'rgba(255,255,255,0.65)',
  display: 'flex',
};
const inputStyle = {
  width: '100%',
  padding: '12px 16px 12px 42px',
  fontSize: '14px',
  border: '1px solid rgba(255,255,255,0.35)',
  borderRadius: '10px',
  backgroundColor: 'rgba(255,255,255,0.08)',
  color: '#ffffff',
  boxSizing: 'border-box',
  outline: 'none',
};

// ช่องกรอก OTP: จัดกึ่งกลาง เว้นระยะตัวอักษร อ่านง่าย
const otpInputStyle = {
  ...inputStyle,
  padding: '12px 16px',
  textAlign: 'center',
  fontSize: '22px',
  letterSpacing: '10px',
  fontFamily: 'monospace',
};

// step: 'request' -> กรอกอีเมลเพื่อขอ OTP, 'verify' -> กรอก OTP + ตั้งรหัสผ่านใหม่
function ForgotPassword({ onBack }) {
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(''); // ข้อความเตือนใต้ช่องอีเมล (เช่น อีเมลไม่ตรงกับข้อมูลในระบบ)
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState(null); // { type: 'success' | 'error', message: string }

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    setEmail(cleanEmail);
    setEmailError('');
    setSubmitting(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email: cleanEmail });
      setPopup({ type: 'success', message: res.data.message });
      setStep('verify');
    } catch (err) {
      const message = err.response?.data?.error || 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่';
      // 404 = อีเมลไม่ตรงกับข้อมูลในระบบ -> เตือนที่ช่องอีเมลด้วย
      if (err.response?.status === 404) setEmailError(message);
      setPopup({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPopup({ type: 'error', message: 'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/reset-password', {
        email,
        otp,
        new_password: newPassword,
      });
      setPopup({ type: 'success', message: res.data.message, done: true });
    } catch (err) {
      setPopup({ type: 'error', message: err.response?.data?.error || 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ' });
    } finally {
      setSubmitting(false);
    }
  };

  const closePopup = () => {
    const done = popup?.done;
    setPopup(null);
    if (done && onBack) onBack(); // ตั้งรหัสผ่านสำเร็จ -> กลับไปหน้า login ให้ล็อกอินใหม่
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Prompt', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #165fa3 0%, #1763b5 45%, #0a4b91 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: 'polygon(0 0, 40% 0, 22% 45%, 0 30%)',
          background: 'rgba(255,255,255,0.05)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: 'polygon(100% 0, 100% 40%, 66% 20%, 80% 0)',
          background: 'rgba(255,255,255,0.06)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '380px', padding: '24px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.75)',
            fontSize: '13.5px',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← กลับไปหน้าเข้าสู่ระบบ
        </button>

        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0' }}>
          ลืมรหัสผ่าน
        </h2>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '0 0 28px 0' }}>
          {step === 'request'
            ? 'กรอกอีเมลที่ลงทะเบียนไว้ เราจะส่งรหัสยืนยันไปให้'
            : `กรอกรหัสยืนยันที่ส่งไปที่ ${email} และตั้งรหัสผ่านใหม่`}
        </p>

        {step === 'request' && (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={fieldWrapperStyle}>
                <span style={iconStyle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 6-10 7L2 6" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="อีเมลที่ลงทะเบียนไว้"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(''); // พิมพ์แก้แล้วเอาข้อความเตือนออก
                  }}
                  required
                  style={emailError ? { ...inputStyle, border: '1px solid #fca5a5' } : inputStyle}
                />
              </div>
              {emailError && (
                <p style={{ fontSize: '12.5px', color: '#fecaca', margin: '8px 0 0 0', lineHeight: 1.5 }}>
                  ⚠ {emailError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '16px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#00b16a',
                border: 'none',
                borderRadius: '10px',
                cursor: submitting ? 'default' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                marginTop: '6px',
              }}
            >
              {submitting ? 'กำลังส่ง...' : 'ส่งรหัสยืนยัน'}
            </button>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                required
                style={otpInputStyle}
              />
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', margin: '8px 0 0 0', textAlign: 'center' }}>
                รหัส 6 หลักจากอีเมล มีอายุ 10 นาที (ถ้าไม่เจอในกล่องจดหมาย ลองดูในโฟลเดอร์สแปม)
              </p>
            </div>

            <div style={fieldWrapperStyle}>
              <span style={iconStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type="password"
                placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                style={inputStyle}
              />
            </div>

            <div style={fieldWrapperStyle}>
              <span style={iconStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type="password"
                placeholder="ยืนยันรหัสผ่านใหม่"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '16px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#00b16a',
                border: 'none',
                borderRadius: '10px',
                cursor: submitting ? 'default' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                marginTop: '6px',
              }}
            >
              {submitting ? 'กำลังบันทึก...' : 'ตั้งรหัสผ่านใหม่'}
            </button>

            <button
              type="button"
              onClick={() => setStep('request')}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '13px',
                cursor: 'pointer',
                padding: 0,
                textAlign: 'center',
              }}
            >
              ไม่ได้รับรหัส? ส่งใหม่อีกครั้ง
            </button>
          </form>
        )}
      </div>

      {/* ========== ป๊อปอัพผลลัพธ์ ========== */}
      {popup && (
        <div
          onClick={closePopup}
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
                backgroundColor: popup.type === 'success' ? '#dcf5e6' : '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              {popup.type === 'success' ? successIcon : errorIcon}
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
              {popup.type === 'success' ? 'สำเร็จ' : 'เกิดข้อผิดพลาด'}
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 22px 0' }}>{popup.message}</p>
            <button
              onClick={closePopup}
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: popup.type === 'success' ? '#00b16a' : '#165fa3',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ForgotPassword;