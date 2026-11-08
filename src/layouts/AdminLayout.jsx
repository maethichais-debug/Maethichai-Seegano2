import React, { useState, useRef, useEffect } from 'react';
// นำโลโก้ที่ผู้ใช้ส่งมาไปวางไว้ที่ src/assets/dorm-logo.png ในโปรเจกต์ก่อน
import dormLogo from '../assets/dorm-logo.png';

const chevron = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const logoutIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const warnIcon = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// key ต้องตรงกับ case ใน renderPage() ของ App.jsx
const topLinks = [{ key: 'dashboard', label: 'Dashboard' }];
const dataMenuItems = [
  { key: 'tenants', label: 'ผู้เช่า' },
  { key: 'rooms', label: 'ห้องพัก' },
  { key: 'leases', label: 'ข้อมูลการเช่า' },
  { key: 'items', label: 'อุปกรณ์' },
  { key: 'borrow', label: 'ยืม-คืน' },
];
const trailingLinks = [
  { key: 'payments', label: 'การเงิน' },
  { key: 'reports', label: 'รายงาน' },
];

function AdminLayout({ children, activeTab, setActiveTab, onLogout, userName = 'ผู้ดูแลระบบ' }) {
  const [openMenu, setOpenMenu] = useState(null); // 'data' | null
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const closeOnOutsideClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const goTo = (key) => {
    setActiveTab(key);
    setOpenMenu(null);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const topLinkStyle = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '10px 4px',
    fontSize: '14.5px',
    fontWeight: active ? 700 : 500,
    color: active ? '#ffffff' : 'rgba(255,255,255,0.85)',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: "'Prompt', sans-serif" }}>
      {/* ========== แถบเมนูด้านบน ========== */}
      <header
        style={{
          backgroundColor: '#2955a8',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          ref={navRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '28px',
            padding: '0 24px',
            height: '58px',
            maxWidth: '1500px',
            margin: '0 auto',
          }}
        >
          {/* โลโก้ */}
          <button
            onClick={() => goTo('dashboard')}
            style={{ display: 'flex', alignItems: 'center', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <img
              src={dormLogo}
              alt="โลโก้หอพัก"
              style={{ height: '38px', width: '38px', objectFit: 'contain', borderRadius: '50%', backgroundColor: '#fff' }}
            />
          </button>

          {/* เมนูหลัก */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '26px', flex: 1 }}>
            {topLinks.map((item) => (
              <button key={item.key} style={topLinkStyle(activeTab === item.key)} onClick={() => goTo(item.key)}>
                {item.label}
              </button>
            ))}

            {/* ดรอปดาวน์: รวมหน้าจัดการข้อมูลทั้งหมด */}
            <div style={{ position: 'relative' }}>
              <button
                style={topLinkStyle(dataMenuItems.some((m) => m.key === activeTab))}
                onClick={() => setOpenMenu(openMenu === 'data' ? null : 'data')}
                onMouseEnter={() => setOpenMenu('data')}
              >
                จัดการข้อมูล
                <span style={{ transform: openMenu === 'data' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                  {chevron}
                </span>
              </button>

              {openMenu === 'data' && (
                <div
                  onMouseLeave={() => setOpenMenu(null)}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 1px)',
                    left: 0,
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    boxShadow: '0 12px 30px rgba(15,23,42,0.18)',
                    padding: '8px',
                    minWidth: '170px',
                    zIndex: 30,
                  }}
                >
                  {dataMenuItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => goTo(item.key)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '9px 12px',
                        borderRadius: '7px',
                        border: 'none',
                        background: activeTab === item.key ? '#eef2ff' : 'transparent',
                        color: activeTab === item.key ? '#2955a8' : '#334155',
                        fontSize: '14px',
                        fontWeight: activeTab === item.key ? 600 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {trailingLinks.map((item) => (
              <button key={item.key} style={topLinkStyle(activeTab === item.key)} onClick={() => goTo(item.key)}>
                {item.label}
              </button>
            ))}
          </nav>

          {/* ฝั่งขวา: ผู้ใช้ + ปุ่มออกจากระบบ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px 6px 6px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.35)',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {userName.charAt(0)}
              </div>
              <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: 500 }}>{userName}</span>
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="ออกจากระบบ"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 14px',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.85)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)')}
            >
              {logoutIcon}
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========== เนื้อหาหลัก ========== */}
      <main style={{ maxWidth: '1500px', margin: '0 auto', padding: '32px 24px' }}>{children}</main>

      {/* ========== ป๊อปอัพยืนยันออกจากระบบ (แทน window.confirm) ========== */}
      {showLogoutConfirm && (
        <div
          onClick={() => setShowLogoutConfirm(false)}
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
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              {warnIcon}
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>ยืนยันออกจากระบบ?</h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 22px 0' }}>คุณจะต้องเข้าสู่ระบบใหม่อีกครั้งเพื่อใช้งานต่อ</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
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
              <button
                onClick={confirmLogout}
                style={{
                  flex: 1,
                  padding: '11px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: '#dc2626',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLayout;