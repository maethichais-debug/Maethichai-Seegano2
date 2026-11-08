import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ConfirmPopup from './ConfirmPopup';
import BorrowItemModal from './BorrowItemModal';

const API_BASE = 'http://localhost:5000';
const BLUE_LIGHT = '#2f6fed';
const MAX_BORROW_DAYS = 30; // ต้องตรงกับ MAX_BORROW_DAYS ใน server.js

function TenantBorrow({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [borrowingItem, setBorrowingItem] = useState(null); // อุปกรณ์ที่กำลังเปิดหน้าต่างยืม
  const [resultPopup, setResultPopup] = useState(null); // { type: 'success' | 'error', message }

  const loadItems = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.get(`${API_BASE}/api/items`);
      setItems(res.data);
    } catch (err) {
      setErrorMsg('โหลดรายการอุปกรณ์ไม่สำเร็จ ตรวจสอบว่า backend เปิดอยู่หรือไม่');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // ส่งคำขอยืมสำเร็จ
  const handleBorrowSuccess = async (message) => {
    const name = borrowingItem?.item_name;
    setBorrowingItem(null);
    setResultPopup({
      type: 'success',
      message: `ส่งคำขอยืม "${name}" สำเร็จแล้ว\n${message || 'รอแอดมินตรวจสลิปและอนุมัติ'}`,
    });
    await loadItems(); // โหลดใหม่ เพราะจำนวนคงเหลือและค่ามัดจำของชิ้นถัดไปอาจเปลี่ยน
  };

  // ของหมด หรือค่ามัดจำเปลี่ยนระหว่างกรอก
  const handleBorrowConflict = async (message) => {
    setBorrowingItem(null);
    setResultPopup({ type: 'error', message });
    await loadItems();
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>ยืม-คืนอุปกรณ์</h2>
      <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px 0' }}>
        เลือกอุปกรณ์ที่ต้องการยืม ชำระค่ามัดจำและแนบสลิป แล้วรอการอนุมัติจากผู้ดูแลหอพัก (ยืมได้ไม่เกิน {MAX_BORROW_DAYS} วัน)
      </p>

      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {errorMsg}
        </div>
      )}

      {loading && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          กำลังโหลดข้อมูล...
        </div>
      )}

      {!loading && items.length === 0 && !errorMsg && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
          ไม่มีอุปกรณ์ที่พร้อมให้ยืมในขณะนี้
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
        {items.map((item) => {
          const deposit = Number(item.next_deposit || 0);
          return (
            <div
              key={item.item_id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100px',
                  borderRadius: '10px',
                  backgroundColor: '#e8eefb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  marginBottom: '12px',
                  overflow: 'hidden',
                }}
              >
                {item.image ? (
                  <img src={item.image} alt={item.item_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  '📦'
                )}
              </div>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14.5px', marginBottom: '4px' }}>
                {item.item_name}
              </div>
              <div style={{ fontSize: '13px', color: deposit > 0 ? '#64748b' : '#059669', marginBottom: '4px' }}>
                {deposit > 0 ? `มัดจำ ฿${deposit.toLocaleString('th-TH')}` : 'ไม่มีค่ามัดจำ'}
              </div>
              <div style={{ fontSize: '12.5px', color: '#94a3b8', marginBottom: '12px' }}>
                คงเหลือ {item.available_quantity} ชิ้น
              </div>
              <button
                onClick={() => setBorrowingItem(item)}
                style={{
                  width: '100%',
                  padding: '9px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: BLUE_LIGHT,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                ยืมอุปกรณ์นี้
              </button>
            </div>
          );
        })}
      </div>

      {/* หน้าต่างยืมอุปกรณ์: เลือกวันคืน + ชำระมัดจำ + แนบสลิป */}
      {borrowingItem && (
        <BorrowItemModal
          item={borrowingItem}
          tenantId={user.id}
          onClose={() => setBorrowingItem(null)}
          onSuccess={handleBorrowSuccess}
          onConflict={handleBorrowConflict}
        />
      )}

      {/* ป๊อปอัปแจ้งผลลัพธ์หลังส่งคำขอ */}
      {resultPopup && (
        <ConfirmPopup
          type={resultPopup.type}
          title={resultPopup.type === 'success' ? 'สำเร็จ' : 'เกิดข้อผิดพลาด'}
          message={resultPopup.message}
          onClose={() => setResultPopup(null)}
        />
      )}
    </div>
  );
}

export default TenantBorrow;