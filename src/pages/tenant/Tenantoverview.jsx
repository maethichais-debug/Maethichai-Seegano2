import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';
const BLUE = '#2955a8';

const statusLabel = { active: 'เช่าอยู่', inactive: 'ย้ายออกแล้ว', pending: 'รอเข้าพัก' };

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMoney(value) {
  if (value === null || value === undefined) return '—';
  return Number(value).toLocaleString('th-TH');
}

function SummaryCard({ title, value, sub, accent }) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
        borderTop: `3px solid ${accent}`,
      }}
    >
      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#94a3b8' }}>{title}</div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '6px 0 2px 0' }}>{value}</div>
      {sub && <div style={{ fontSize: '12.5px', color: '#64748b' }}>{sub}</div>}
    </div>
  );
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '18px 12px',
        backgroundColor: '#ffffff',
        border: 'none',
        borderRadius: '14px',
        boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: '26px' }}>{icon}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{label}</span>
    </button>
  );
}

// setActiveTab ส่งมาจาก TenantApp เพื่อให้ปุ่มเมนูด่วนสลับแท็บได้จริง
function TenantOverview({ user, setActiveTab }) {
  const [summary, setSummary] = useState(null);
  const [overdue, setOverdue] = useState({ overdue_count: 0, overdue_total: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // เพิ่ม: ดึงยอดค้างชำระรวมทุกบิล (ไม่ใช่แค่บิลล่าสุด 1 รายการแบบ summary.payment_due เดิม)
        const [summaryRes, overdueRes] = await Promise.all([
          axios.get(`${API_BASE}/api/tenant/${user.id}/summary`),
          axios.get(`${API_BASE}/api/tenant/${user.id}/overdue-summary`),
        ]);
        if (active) {
          setSummary(summaryRes.data);
          setOverdue(overdueRes.data);
        }
      } catch (err) {
        if (active) setErrorMsg('โหลดข้อมูลสรุปไม่สำเร็จ ตรวจสอบว่า backend เปิดอยู่หรือไม่');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user.id]);

  const lease = summary?.lease;
  const paymentDue = summary?.payment_due;
  const hasOverdue = overdue.overdue_count > 0;

  return (
    <div>
      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '14px',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* เพิ่มใหม่: แบนเนอร์เตือนยอดค้างชำระ — ขึ้นเฉพาะตอนมีบิลค้าง กดแล้วไปหน้าการเงินทันที */}
      {!loading && hasOverdue && (
        <div
          onClick={() => setActiveTab('payments')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '20px',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
              }}
            >
              ⚠️
            </div>
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#991b1b' }}>
                คุณมียอดค้างชำระ {overdue.overdue_count} รายการ รวม ฿{formatMoney(overdue.overdue_total)}
              </div>
              <div style={{ fontSize: '12.5px', color: '#b91c1c', marginTop: '2px' }}>
                แตะเพื่อดูรายละเอียดและแนบสลิปการโอนเงิน
              </div>
            </div>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', whiteSpace: 'nowrap' }}>ดูรายละเอียด →</span>
        </div>
      )}

      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          กำลังโหลดข้อมูล...
        </div>
      )}

      {!loading && !errorMsg && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
              marginBottom: '24px',
            }}
          >
            <SummaryCard
              title="ห้องพัก"
              value={lease ? lease.room_number : 'ยังไม่มีห้อง'}
              sub={lease ? lease.room_type : 'ติดต่อผู้ดูแลหอพัก'}
              accent={BLUE}
            />
            <SummaryCard
              title="ยอดค้างชำระ"
              value={paymentDue ? `฿${formatMoney(paymentDue.amount)}` : 'ไม่มีค้างชำระ'}
              sub={paymentDue ? `ครบกำหนด ${formatDate(paymentDue.payment_date)}` : 'สถานะปกติ'}
              accent={paymentDue ? '#dc2626' : '#00915a'}
            />
            <SummaryCard
              title="อุปกรณ์ที่ยืมอยู่"
              value={`${summary?.borrowing_count ?? 0} ชิ้น`}
              sub="รวมที่รออนุมัติและกำลังยืม"
              accent="#b45309"
            />
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '22px',
              boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              ข้อมูลห้องพักและสัญญาเช่า
            </h3>
            {lease ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>ห้องพัก</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                    {lease.room_number} ({lease.room_type})
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>ค่าเช่าต่อเดือน</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>฿{formatMoney(lease.price)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>วันเริ่มสัญญา</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatDate(lease.start_date)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>สถานะบัญชี</span>
                  <span
                    style={{
                      backgroundColor: '#e0eaff',
                      color: BLUE,
                      fontSize: '12.5px',
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: '999px',
                    }}
                  >
                    {statusLabel[summary.tenant.status] || summary.tenant.status}
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                ยังไม่มีห้องพักผูกกับบัญชีนี้ กรุณาติดต่อผู้ดูแลหอพักเพื่อยืนยันห้องพัก
              </p>
            )}
          </div>

          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px 0' }}>เมนูด่วน</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
            <QuickAction icon="📦" label="ยืม-คืนอุปกรณ์" onClick={() => setActiveTab('borrow')} />
            <QuickAction icon="🧾" label="ประวัติการยืม" onClick={() => setActiveTab('history')} />
            <QuickAction icon="💳" label="การเงิน" onClick={() => setActiveTab('payments')} />
            <QuickAction icon="👤" label="ข้อมูลส่วนตัว" onClick={() => setActiveTab('profile')} />
          </div>
        </>
      )}
    </div>
  );
}

export default TenantOverview;