import React, { useState } from 'react';
import './App.css';

// 1. Import หน้า Login
import Login from './pages/Login';

// 2. Import Layout และ Pages ฝั่งแอดมิน
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Rooms from './pages/Rooms';
import Leases from './pages/Leases';
import Items from './pages/Items';
import BorrowReturn from './pages/BorrowReturn';
import Payments from './pages/Payments';
import Reports from './pages/Reports';

// 3. Import หน้าฝั่งผู้เช่า (จุดเริ่มต้น — จะขยายเพิ่มทีหลัง)
import TenantApp from './pages/tenant/Tenantapp';

function App() {
  // State เก็บข้อมูลผู้ใช้งาน (ถ้าเป็น null แปลว่ายังไม่ได้เข้าสู่ระบบ)
  const [user, setUser] = useState(null);

  // State สำหรับเปลี่ยนหน้าเมนูฝั่ง Admin
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
  };

  // ฟังก์ชันเลือกแสดงหน้าตามเมนูที่กดเลือก (เฉพาะฝั่งแอดมิน)
  const renderAdminPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'tenants':
        return <Tenants />;
      case 'rooms':
        return <Rooms />;
      case 'leases':
        return <Leases />;
      case 'items':
        return <Items />;
      case 'borrow':
        return <BorrowReturn />;
      case 'payments':
        return <Payments />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  // -------------------------------------------------------------
  // เงื่อนไขที่ 1: ถ้ายังไม่ได้เข้าสู่ระบบ ให้แสดงหน้า Login
  // -------------------------------------------------------------
  if (!user) {
    return <Login onLoginSuccess={(userData) => setUser(userData)} />;
  }

  // -------------------------------------------------------------
  // เงื่อนไขที่ 2: เข้าสู่ระบบแล้ว แต่เป็นบัญชี "ผู้เช่า" (role: tenant)
  // ไปหน้าฝั่งผู้ใช้ ไม่ใช่หน้าแอดมิน
  // -------------------------------------------------------------
  if (user.role === 'tenant') {
  return <TenantApp user={user} onLogout={handleLogout} />;
}

  // -------------------------------------------------------------
  // เงื่อนไขที่ 3: เข้าสู่ระบบแล้ว และเป็นบัญชี "แอดมิน" (role: admin)
  // ให้แสดงหน้า Admin พร้อมแถบเมนู
  // -------------------------------------------------------------
  return (
    <AdminLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
      userName="Admin"
    >
      {renderAdminPage()}
    </AdminLayout>
  );
}

export default App;