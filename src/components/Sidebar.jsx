import React from 'react';

function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🔲' },
    { id: 'tenants', label: 'ผู้เช่า', icon: '👥' },
    { id: 'rooms', label: 'ห้องพัก', icon: '🏢' },
    { id: 'items', label: 'อุปกรณ์', icon: '📦' },
    { id: 'borrow', label: 'ยืม-คืน', icon: '🔄' },
    { id: 'payments', label: 'การเงิน', icon: '💲' },
    { id: 'reports', label: 'รายงาน', icon: '📄' },
  ];

  return (
    <div className="sidebar-container">
      <div>
        {/* Header แบรนด์หอพัก */}
        <div className="sidebar-brand">
          <div className="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <path d="M9 22v-4h6v4" />
              <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
            </svg>
          </div>
          <div>
            <div className="brand-title">จัดการหอพัก</div>
            <div className="brand-subtitle">ระบบผู้ดูแล</div>
          </div>
        </div>

        {/* รายการเมนู */}
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li
              key={item.id}
              className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ด้านล่างสุด: แสดงโปรไฟล์ & ปุ่มออกจากระบบ */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">ผ</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>ผู้ดูแลระบบ</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>ผู้ดูแลระบบ</div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <span>➔</span>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;