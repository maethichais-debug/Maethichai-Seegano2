import React, { useState } from 'react';
// ไฟล์นี้อยู่ที่ src/pages/tenant/ ส่วน PopupModal อยู่ที่ src/components/ จึงต้องถอยขึ้น 2 ชั้น
// ถ้าคุณวางไฟล์ไว้ที่อื่น ให้ปรับ path บรรทัดนี้ให้ตรง
import PopupModal from '../../components/PopupModal';

const BLUE = '#2955a8';

const TABS = [
  { key: 'home', label: 'หน้าหลัก' },
  { key: 'borrow', label: 'ยืม-คืนอุปกรณ์' },
  { key: 'history', label: 'ประวัติการยืม' },
  { key: 'payments', label: 'การเงิน' },
  { key: 'profile', label: 'ข้อมูลส่วนตัว' },
];

function TenantLayout({ user, activeTab, setActiveTab, onLogout, children }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: "'Prompt', sans-serif" }}>
      <header style={{ backgroundColor: BLUE }}>
        <div
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '16px' }}>
              สวัสดี, {user.first_name} {user.last_name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12.5px' }}>บัญชีผู้เช่า</div>
          </div>
          {/* กดแล้วเปิด popup ยืนยันก่อน ยังไม่ออกจากระบบทันที */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ออกจากระบบ
          </button>
        </div>

        {/* แถบเมนู — สไตล์เดียวกับฝั่งแอดมิน */}
        <nav style={{ maxWidth: '960px', margin: '0 auto', padding: '0 20px', display: 'flex', gap: '4px', overflowX: 'auto' }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  background: 'none',
                  color: active ? '#ffffff' : 'rgba(255,255,255,0.6)',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderBottom: active ? '3px solid #ffffff' : '3px solid transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '28px 20px 48px 20px' }}>
        {children}
      </main>

      {/* Popup กลางจอ: ยืนยันการออกจากระบบ (แบบเดียวกับฝั่งแอดมิน) */}
      <PopupModal
        open={showLogoutConfirm}
        type="confirm"
        title="ออกจากระบบ"
        message="ยืนยันว่าต้องการออกจากระบบใช่หรือไม่?"
        confirmText="ออกจากระบบ"
        cancelText="ยกเลิก"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}

export default TenantLayout;