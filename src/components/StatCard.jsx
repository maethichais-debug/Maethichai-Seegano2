import React from 'react';

function StatCard({ title, value, icon, color }) {
  return (
    <div style={{
      background: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderLeft: `5px solid ${color || '#007bff'}`
    }}>
      <div>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{title}</p>
        <h2 style={{ margin: '5px 0 0 0', fontSize: '24px' }}>{value}</h2>
      </div>
      <div style={{ fontSize: '30px' }}>{icon}</div>
    </div>
  );
}

export default StatCard;