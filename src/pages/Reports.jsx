import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';
const BLUE = '#2955a8';
const BLUE_LIGHT = '#2f6fed';

// นิยาม tab รายงานทั้ง 4 แบบ ตามหัวข้อ 6.1-6.4 ในเอกสารบทที่ 3
const REPORT_TABS = [
  { id: 'borrow', label: 'ยืม-คืน' },
  { id: 'stock', label: 'อุปกรณ์คงเหลือ' },
  { id: 'history', label: 'ประวัติผู้เช่า' },
  { id: 'overdue', label: 'ค้างชำระ' },
];

// endpoint ของแต่ละรายงาน (อยู่ใน server.js หัวข้อ 18)
const REPORT_ENDPOINT = {
  borrow: '/api/reports/borrow-history',
  stock: '/api/reports/equipment-stock',
  history: '/api/reports/tenant-history',
  overdue: '/api/reports/overdue-rent',
};

// หัวตารางของแต่ละแท็บ (key ต้องตรงกับ key ของแต่ละแถวข้อมูลจาก backend)
// type: 'date' = แสดงวันที่แบบไทย, 'money' = แสดงเป็นจำนวนเงิน, 'status' = badge สี,
//       'image' = แสดงรูปย่อ (ไม่นำไปรวมในการค้นหา/ส่งออก CSV), ไม่ใส่ = ข้อความธรรมดา
const TABLE_CONFIG = {
  borrow: {
    title: 'ประวัติการยืม-คืนอุปกรณ์',
    columns: [
      { key: 'borrower', label: 'ผู้ยืม' },
      { key: 'equipment', label: 'อุปกรณ์' },
      { key: 'borrow_date', label: 'วันที่ยืม', type: 'date' },
      { key: 'due_date', label: 'กำหนดคืน', type: 'date' },
      { key: 'return_date', label: 'วันที่คืน', type: 'date' },
      { key: 'deposit', label: 'ค่ามัดจำ', type: 'money' },
      { key: 'status', label: 'สถานะ', type: 'status' },
    ],
  },
  stock: {
    title: 'รายงานอุปกรณ์คงเหลือ',
    columns: [
      { key: 'image', label: 'รูปอุปกรณ์', type: 'image' }, // เปลี่ยนจาก "รหัสอุปกรณ์" เป็นรูปอุปกรณ์
      { key: 'equipment', label: 'ชื่ออุปกรณ์' },
      { key: 'available', label: 'คงเหลือ/ทั้งหมด' },
      { key: 'deposit', label: 'ค่ามัดจำ' },
      { key: 'status', label: 'สถานะ', type: 'status' },
    ],
  },
  history: {
    title: 'ประวัติการยืมของผู้พักอาศัย',
    columns: [
      { key: 'tenant', label: 'ผู้เช่า' },
      { key: 'room', label: 'ห้อง' },
      { key: 'equipment', label: 'อุปกรณ์' },
      { key: 'date', label: 'วันที่ทำรายการ', type: 'date' },
      { key: 'status', label: 'สถานะ', type: 'status' },
    ],
  },
  overdue: {
    title: 'สรุปการค้างชำระค่าเช่าห้องพัก',
    columns: [
      { key: 'tenant', label: 'ผู้เช่า' },
      { key: 'room', label: 'ห้อง' },
      { key: 'type', label: 'ประเภท' },
      { key: 'amount', label: 'ยอดค้างชำระ', type: 'money' },
      { key: 'due_date', label: 'งวด/ครบกำหนด', type: 'date' },
      { key: 'status', label: 'สถานะ', type: 'status' },
    ],
  },
};

// สี badge ตามคำสถานะที่พบได้ในแต่ละรายงาน
const STATUS_STYLE = {
  'คืนแล้ว': { bg: '#d1fae5', color: '#059669' },
  'ยืมอยู่': { bg: '#e0eaff', color: BLUE },
  'เกินกำหนด': { bg: '#fee2e2', color: '#dc2626' },
  'รออนุมัติ': { bg: '#fef3c7', color: '#b45309' },
  'พร้อมให้ยืม': { bg: '#d1fae5', color: '#059669' },
  'ถูกยืม': { bg: '#fef3c7', color: '#b45309' },
  'ไม่มีชิ้น': { bg: '#f1f5f9', color: '#475569' },
  'ค้างชำระ': { bg: '#fee2e2', color: '#dc2626' },
  'รอตรวจสลิป': { bg: '#fef3c7', color: '#b45309' },
  'ใกล้ครบกำหนด': { bg: '#fef3c7', color: '#b45309' },
};

// วันที่จาก backend เป็น YYYY-MM-DD -> แสดงแบบไทย ถ้าเป็นรูปแบบอื่น (เช่น 2026-10) แสดงตามเดิม
function formatDate(value) {
  if (!value) return '-';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  if (!m) return String(value);
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMoney(value) {
  const n = Number(value);
  if (value == null || Number.isNaN(n)) return '-';
  return `${n.toLocaleString('th-TH')} บาท`;
}

// รูปอาจเป็น data URL (base64) หรือ path ไฟล์บนเซิร์ฟเวอร์ (เช่น /uploads/xxx.jpg) -> ต่อ API_BASE ให้เฉพาะแบบ path
function imageSrc(value) {
  if (!value) return '';
  const v = String(value);
  if (v.startsWith('data:') || v.startsWith('http')) return v;
  return `${API_BASE}${v.startsWith('/') ? '' : '/'}${v}`;
}

// ข้อความที่แสดงจริงในแต่ละช่อง (ใช้ทั้งในตาราง การค้นหา และการส่งออก CSV)
function cellText(col, row) {
  const v = row[col.key];
  if (col.type === 'date') return formatDate(v);
  if (col.type === 'money') return formatMoney(v);
  return v == null || v === '' ? '-' : String(v);
}

function csvEscape(text) {
  return `"${String(text).replace(/"/g, '""')}"`;
}

function StatusBadge({ value }) {
  const style = STATUS_STYLE[value] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span
      style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: '4px 12px',
        borderRadius: '999px',
        fontSize: '12.5px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {value ?? '-'}
    </span>
  );
}

// รูปย่ออุปกรณ์ในตาราง — ไม่มีรูปหรือโหลดรูปไม่ได้ จะแสดงไอคอน 📦 แทน
function EquipmentThumb({ src, alt }) {
  const [broken, setBroken] = useState(false);
  const url = imageSrc(src);
  return (
    <div
      style={{
        width: '44px',
        height: '44px',
        borderRadius: '10px',
        backgroundColor: '#e8eefb',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
      }}
    >
      {url && !broken ? (
        <img
          src={url}
          alt={alt || 'รูปอุปกรณ์'}
          onError={() => setBroken(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        '📦'
      )}
    </div>
  );
}

function Reports() {
  const [activeTab, setActiveTab] = useState('borrow');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');

  // ยิง API ตาม endpoint ของแต่ละรายงานเมื่อสลับแท็บ
  useEffect(() => {
    let cancelled = false;
    const fetchReport = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await axios.get(`${API_BASE}${REPORT_ENDPOINT[activeTab]}`);
        if (!cancelled) setRows(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('ดึงข้อมูลรายงานล้มเหลว:', err);
        if (!cancelled) {
          setRows([]);
          setErrorMsg(err.response?.data?.error || 'โหลดรายงานไม่สำเร็จ ตรวจสอบว่า backend เปิดอยู่หรือไม่');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchReport();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const changeTab = (id) => {
    setActiveTab(id);
    setSearch('');
    setRows([]); // กันตารางเก่าค้างระหว่างโหลดแท็บใหม่
  };

  const config = TABLE_CONFIG[activeTab];
  // คอลัมน์ที่เป็นข้อความจริง (ตัดคอลัมน์รูปออก เพราะไม่ต้องการให้ค้นหา/ส่งออกเป็นข้อมูลรูป base64 ยาวๆ)
  const textColumns = config.columns.filter((c) => c.type !== 'image');

  // ค้นหาจากข้อความที่ผู้ใช้เห็นจริง (เช่น พิมพ์ "ต.ค." หรือ "100 บาท" ก็เจอ)
  const filteredRows = rows.filter((row) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return textColumns.some((col) => cellText(col, row).toLowerCase().includes(q));
  });

  // ส่งออกเป็น CSV (ใส่ BOM เพื่อให้ Excel เปิดภาษาไทยได้ถูกต้อง) ตามรายการที่กรองอยู่ตอนนี้
  const handleExport = () => {
    if (filteredRows.length === 0) {
      alert('ไม่มีข้อมูลให้ส่งออก');
      return;
    }
    const header = textColumns.map((c) => csvEscape(c.label)).join(',');
    const lines = filteredRows.map((row) => textColumns.map((c) => csvEscape(cellText(c, row))).join(','));
    const csv = '\uFEFF' + [header, ...lines].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${activeTab}-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* ส่วนหัวหน้า */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: 0 }}>รายงาน</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>ดูรายงานข้อมูลต่างๆ ในระบบ</p>
      </div>

      {/* แท็บเลือกประเภทรายงาน (แบบเดียวกับหน้ายืม-คืนอุปกรณ์) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {REPORT_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => changeTab(tab.id)}
              style={{
                padding: '8px 16px',
                fontSize: '13.5px',
                fontWeight: 600,
                color: active ? '#ffffff' : BLUE,
                backgroundColor: active ? BLUE_LIGHT : '#e8eefb',
                border: 'none',
                borderRadius: '999px',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

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

      {/* การ์ดตารางรายงาน */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' }}>
        {/* แถบหัวการ์ด + ช่องค้นหา/ปุ่ม export */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{config.title}</h3>
            {!loading && !errorMsg && (
              <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px' }}>
                {search.trim() ? `พบ ${filteredRows.length} จาก ${rows.length} รายการ` : `ทั้งหมด ${rows.length} รายการ`}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="ค้นหา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '10px 14px',
                border: '1px solid #dbe3ef',
                borderRadius: '10px',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                minWidth: '180px',
              }}
            />
            <button
              onClick={handleExport}
              disabled={loading}
              style={{
                backgroundColor: BLUE_LIGHT,
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.6 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              ส่งออกรายงาน
            </button>
          </div>
        </div>

        {/* ตาราง */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#e8eefb' }}>
                {config.columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: '14px 24px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={config.columns.length}
                    style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}
                  >
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={config.columns.length}
                    style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}
                  >
                    ไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={row.id ?? idx} style={{ borderTop: '1px solid #f1f5f9', fontSize: '14px' }}>
                    {config.columns.map((col) => (
                      <td key={col.key} style={{ padding: '14px 24px', color: '#334155', whiteSpace: 'nowrap' }}>
                        {col.type === 'status' ? (
                          <StatusBadge value={row[col.key]} />
                        ) : col.type === 'image' ? (
                          <EquipmentThumb src={row[col.key]} alt={row.equipment} />
                        ) : (
                          cellText(col, row)
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;