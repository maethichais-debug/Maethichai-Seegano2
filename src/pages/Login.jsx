import React, { useState } from 'react';
import axios from 'axios';
// นำโลโก้ที่ผู้ใช้ส่งมาไปวางไว้ที่ src/assets/dorm-logo.png ในโปรเจกต์ก่อน
// (ไฟล์แนบมาให้แล้วในชื่อ dorm-logo.png)
import dormLogo from '../assets/dorm-logo.png';
import ForgotPassword from './Forgotpassword';

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

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [popup, setPopup] = useState(null); // { type: 'success' | 'error', message: string, user? } | null
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password,
      });
      setPopup({ type: 'success', message: response.data.message, user: response.data.user });
    } catch (error) {
      setPopup({ type: 'error', message: error.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ' });
    }
  };

  const closePopup = () => {
    const wasSuccess = popup?.type === 'success';
    const user = popup?.user;
    setPopup(null);
    if (wasSuccess && onLoginSuccess) {
      onLoginSuccess(user);
    }
  };

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
  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Prompt', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #165fa3 0%, #1763b5 45%, #0a4b91 100%)',
      }}
    >
      {/* สไตล์ของช่องกรอก: inline style เปลี่ยนสี placeholder ไม่ได้ จึงใส่ไว้ตรงนี้ */}
      <style>{`
        .login-input {
          caret-color: #ffffff;
        }
        .login-input::placeholder {
          color: rgba(255, 255, 255, 0.8);
          opacity: 1;
        }
        /* กัน Chrome เติมรหัสอัตโนมัติ (เช่นตอนติ๊ก "จดจำฉัน") แล้วตัวอักษรกลับเป็นสีเข้ม */
        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover,
        .login-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff;
          caret-color: #ffffff;
          transition: background-color 9999s ease-in-out 0s;
        }
      `}</style>

      {/* เหลี่ยม polygon ตกแต่งพื้นหลังทั้งหน้า */}
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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: 'polygon(0 60%, 30% 75%, 12% 100%, 0 100%)',
          background: 'rgba(255,255,255,0.04)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: 'polygon(72% 100%, 100% 72%, 100% 100%)',
          background: 'rgba(16,177,106,0.15)',
        }}
      />

      {/* เส้นแบ่งกลางบางๆ ระหว่างฝั่งโลโก้กับฟอร์ม เหมือนภาพตัวอย่าง */}
      <div
        style={{
          position: 'absolute',
          left: '46%',
          top: '18%',
          bottom: '18%',
          width: '1px',
          backgroundColor: 'rgba(255,255,255,0.25)',
          zIndex: 1,
        }}
      />

      {/* ========== ฝั่งซ้าย: โลโก้หอพัก ========== */}
      <div
        style={{
          flex: '1 1 46%',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={dormLogo}
          alt="โลโก้หอพัก"
          style={{
            width: '200px',
            height: '200px',
            objectFit: 'contain',
            borderRadius: '50%',
            filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.4))',
          }}
        />
        <p
          style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: '14px',
            marginTop: '18px',
            letterSpacing: '0.5px',
          }}
        >
          ระบบจัดการหอพักและการยืม-คืนอุปกรณ์
        </p>
      </div>

      {/* ========== ฝั่งขวา: ฟอร์มล็อกอินวางตรงบนพื้นหลังเข้ม ========== */}
      <div
        style={{
          flex: '1 1 54%',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0' }}>
            ระบบจัดการหอพัก
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '0 0 28px 0' }}>
            เข้าสู่ระบบเพื่อดำเนินการต่อ
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* ชื่อผู้ใช้ */}
            <div style={fieldWrapperStyle}>
              <span style={iconStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                className="login-input"
                type="text"
                placeholder="ชื่อผู้ใช้"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            {/* รหัสผ่าน */}
            <div style={fieldWrapperStyle}>
              <span style={iconStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                className="login-input"
                type="password"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            {/* จดจำฉัน + ลืมรหัสผ่าน */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.75)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: '#00b16a', cursor: 'pointer' }}
                />
                จดจำฉัน
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  setShowForgotPassword(true);
                }}
                style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: 500 }}
              >
                ลืมรหัสผ่าน?
              </a>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '16px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#00b16a',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                marginTop: '6px',
              }}
            >
              เข้าสู่ระบบ
            </button>
          </form>
        </div>
      </div>

      {/* ========== ป๊อปอัพผลลัพธ์ (แทน alert()) ========== */}
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
              {popup.type === 'success' ? 'เข้าสู่ระบบสำเร็จ' : 'เข้าสู่ระบบไม่สำเร็จ'}
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

export default Login;