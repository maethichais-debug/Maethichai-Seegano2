import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';
const BLUE = '#2955a8';
const BLUE_LIGHT = '#2f6fed';

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '14px',
  padding: '20px 22px',
  boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
};

const iconBoxStyle = (bg) => ({
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  backgroundColor: bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
  flexShrink: 0,
});

const panelStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '14px',
  padding: '22px',
  boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
};

const listItemStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 0',
  borderTop: '1px solid #f1f5f9',
  cursor: 'pointer',
};

// รับ setActiveTab มาจาก parent (App.jsx) เพื่อให้การ์ด/รายการต่างๆ
// กดแล้วพาไปหน้าเมนูที่เกี่ยวข้องได้ (เหมือนคลิกเมนูใน Navbar)
function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState({ tenants_total: 0, rooms_total: 0, rooms_available: 0, items_total: 0, payments_pending: 0 });
  const [rooms, setRooms] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const goTo = (tabId) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tabId);
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [statsRes, roomsRes, paymentsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/dashboard/stats`),
        axios.get(`${API_BASE}/api/rooms`),
        axios.get(`${API_BASE}/api/dashboard/recent-payments`),
      ]);
      setStats(statsRes.data);
      setRooms(roomsRes.data.slice(0, 4)); // โชว์แค่ 4 ห้องแรกในแผงสรุป
      setPayments(paymentsRes.data);
    } catch (err) {
      setErrorMsg('โหลดข้อมูล Dashboard ไม่สำเร็จ ตรวจสอบว่า backend เปิดอยู่หรือไม่');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const paymentStatusLabel = { pending: 'รอตรวจสอบ', approved: 'อนุมัติแล้ว', rejected: 'ถูกปฏิเสธ' };
  const paymentStatusStyle = {
    pending: { backgroundColor: '#fef3c7', color: '#b45309' },
    approved: { backgroundColor: '#dcf5e6', color: '#00915a' },
    rejected: { backgroundColor: '#fee2e2', color: '#dc2626' },
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>ภาพรวมระบบจัดการหอพัก</p>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>กำลังโหลดข้อมูล...</div>
      ) : (
        <>
          {/* การ์ดสรุปตัวเลข 4 ช่อง */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '18px',
              marginBottom: '22px',
            }}
          >
            <div style={cardStyle} onClick={() => goTo('tenants')}>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>ผู้เช่าทั้งหมด</div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>{stats.tenants_total}</div>
              </div>
              <div style={iconBoxStyle(BLUE_LIGHT)}>👥</div>
            </div>

            <div style={cardStyle} onClick={() => goTo('rooms')}>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>ห้องว่าง</div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>
                  {stats.rooms_available}
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}> / {stats.rooms_total}</span>
                </div>
              </div>
              <div style={iconBoxStyle('#00b16a')}>🏠</div>
            </div>

            <div style={cardStyle} onClick={() => goTo('items')}>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>อุปกรณ์ทั้งหมด</div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>{stats.items_total}</div>
              </div>
              <div style={iconBoxStyle('#a855f7')}>📦</div>
            </div>

            <div style={cardStyle} onClick={() => goTo('payments')}>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>รอตรวจสลิป</div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>{stats.payments_pending}</div>
              </div>
              <div style={iconBoxStyle('#f59e0b')}>$</div>
            </div>
          </div>

          {/* แผงห้องพัก + การเงินล่าสุด */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
            <div style={panelStyle}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>ห้องพักทั้งหมด</h2>
              {rooms.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '12px' }}>ยังไม่มีข้อมูลห้องพัก</p>
              ) : (
                rooms.map((r) => (
                  <div key={r.room_id} style={listItemStyle} onClick={() => goTo('rooms')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ ...iconBoxStyle('#e0eaff'), width: '36px', height: '36px', fontSize: '16px' }}>🏠</div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>ห้อง {r.room_number}</div>
                        <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>{r.room_type}</div>
                      </div>
                    </div>
                    {r.occupied_tenant_id ? (
                      <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '999px' }}>
                        เต็ม
                      </span>
                    ) : (
                      <span style={{ backgroundColor: '#dcf5e6', color: '#00915a', fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '999px' }}>
                        ว่าง
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>การเงินล่าสุด</h2>
              {payments.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '12px' }}>ยังไม่มีรายการชำระเงิน</p>
              ) : (
                payments.map((p) => {
                  const style = paymentStatusStyle[p.payment_status] || paymentStatusStyle.pending;
                  const label = paymentStatusLabel[p.payment_status] || p.payment_status;
                  return (
                    <div key={p.transaction_id} style={listItemStyle} onClick={() => goTo('payments')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ ...iconBoxStyle('#e0f2fe'), width: '36px', height: '36px', fontSize: '16px', color: '#0284c7' }}>$</div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                            {p.first_name} {p.last_name}
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>฿{Number(p.amount).toLocaleString()}</div>
                        </div>
                      </div>
                      <span style={{ ...style, fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '999px' }}>{label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;