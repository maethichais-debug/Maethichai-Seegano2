import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';
const BLUE = '#2955a8';
const BLUE_LIGHT = '#2f6fed';

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  fontSize: '14px',
  border: '1px solid #dbe3ef',
  borderRadius: '10px',
  backgroundColor: '#f8fafc',
  color: '#0f172a',
  boxSizing: 'border-box',
  outline: 'none',
};
const labelStyle = { display: 'block', fontSize: '13.5px', fontWeight: 600, color: BLUE, marginBottom: '7px' };

function ReadOnlyRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ fontWeight: 600, color: '#0f172a' }}>{value || '—'}</span>
    </div>
  );
}

// onChangePassword ส่งมาจาก TenantApp เพื่อสลับไปหน้า ForgotPassword (ใช้ flow OTP เดียวกับหน้า login)
function TenantProfile({ user, onChangePassword }) {
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/tenant/${user.id}/profile`);
        if (active) {
          setProfile(res.data);
          setPhone(res.data.phone || '');
          setEmail(res.data.email || '');
        }
      } catch (err) {
        if (active) setErrorMsg('โหลดข้อมูลส่วนตัวไม่สำเร็จ');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/api/tenant/${user.id}/profile`, { phone, email });
      alert('บันทึกข้อมูลสำเร็จ');
    } catch (err) {
      alert(err.response?.data?.error || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>ข้อมูลส่วนตัว</h2>
      <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px 0' }}>แก้ไขเบอร์โทรศัพท์และอีเมลของคุณ</p>

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

      {!loading && profile && (
        <>
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '22px',
              boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
              marginBottom: '20px',
            }}
          >
            <ReadOnlyRow label="ชื่อ-นามสกุล" value={`${profile.first_name} ${profile.last_name}`} />
            <ReadOnlyRow label="ชื่อผู้ใช้ (username)" value={profile.username} />
            <ReadOnlyRow label="เลขบัตรประชาชน" value={profile.id_card} />
            <ReadOnlyRow label="ที่อยู่" value={profile.address} />
            <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '10px' }}>
              ข้อมูลส่วนนี้แก้ไขเองไม่ได้ กรุณาติดต่อผู้ดูแลหอพักหากต้องการเปลี่ยนแปลง
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '22px',
              boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>แก้ไขข้อมูลติดต่อ</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>เบอร์โทรศัพท์</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>อีเมล</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  alignSelf: 'flex-start',
                  padding: '10px 22px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: BLUE_LIGHT,
                  border: 'none',
                  borderRadius: '10px',
                  cursor: saving ? 'default' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '22px', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>ความปลอดภัย</h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 14px 0' }}>
              เปลี่ยนรหัสผ่านด้วยการยืนยันรหัส OTP ทางอีเมล
            </p>
            <button
              onClick={onChangePassword}
              style={{
                padding: '10px 22px',
                fontSize: '14px',
                fontWeight: 600,
                color: BLUE,
                backgroundColor: '#e8eefb',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              เปลี่ยนรหัสผ่าน
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TenantProfile;