import React from 'react';

function StatusBadge({ status }) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'available':
      case 'approved':
      case 'paid':
        return { backgroundColor: '#28a745', color: '#fff' };
      case 'occupied':
      case 'borrowed':
      case 'pending':
        return { backgroundColor: '#ffc107', color: '#000' };
      case 'overdue':
      case 'rejected':
        return { backgroundColor: '#dc3545', color: '#fff' };
      default:
        return { backgroundColor: '#6c757d', color: '#fff' };
    }
  };

  return (
    <span style={{
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
      ...getBadgeStyle()
    }}>
      {status}
    </span>
  );
}

export default StatusBadge;