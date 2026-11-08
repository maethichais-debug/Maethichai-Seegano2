import React, { useState } from 'react';
import TenantLayout from './TenantLayout';
import TenantOverview from './TenantOverview';
import TenantBorrow from './TenantBorrow';
import TenantHistory from './TenantHistory';
import TenantPayments from './TenantPayments';
import TenantProfile from './TenantProfile';
// ForgotPassword.jsx อยู่ที่ src/pages/ (ระดับเดียวกับ Login.jsx) — ปรับ path นี้ถ้าคุณวางไฟล์ไว้ที่อื่น
import ForgotPassword from '../Forgotpassword';

function TenantApp({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [changingPassword, setChangingPassword] = useState(false);

  // ตอนกด "เปลี่ยนรหัสผ่าน" ในหน้าโปรไฟล์ ใช้ flow OTP เดียวกับหน้า login เลย
  // (เต็มจอ ไม่อยู่ใน TenantLayout เพราะ ForgotPassword ออกแบบมาเป็นหน้าเต็มจอ)
  if (changingPassword) {
    return <ForgotPassword onBack={() => setChangingPassword(false)} />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <TenantOverview user={user} setActiveTab={setActiveTab} />;
      case 'borrow':
        return <TenantBorrow user={user} />;
      case 'history':
        return <TenantHistory user={user} />;
      case 'payments':
        return <TenantPayments user={user} />;
      case 'profile':
        return <TenantProfile user={user} onChangePassword={() => setChangingPassword(true)} />;
      default:
        return <TenantOverview user={user} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <TenantLayout user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout}>
      {renderPage()}
    </TenantLayout>
  );
}

export default TenantApp;