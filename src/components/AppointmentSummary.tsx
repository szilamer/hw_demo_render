import React from 'react';
import { format } from 'date-fns';
import { AppointmentEvent } from './Calendar';

interface AppointmentSummaryProps {
  slot: AppointmentEvent;
  summary: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const AppointmentSummary: React.FC<AppointmentSummaryProps> = ({
  slot,
  summary,
  onConfirm,
  onCancel
}) => {
  return (
    <div className="appointment-summary" style={{ 
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3>Időpontfoglalás Összefoglaló</h3>
      <div className="appointment-details">
        <p><strong>Időpont:</strong> {format(new Date(slot.start), 'yyyy-MM-dd HH:mm')}</p>
      </div>
      <div className="summary-content" style={{
        margin: '20px 0',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px'
      }}>
        <h4>Orvosi Összefoglaló</h4>
        <div style={{ whiteSpace: 'pre-wrap' }}>{summary}</div>
      </div>
      <div className="action-buttons" style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '20px'
      }}>
        <button 
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Vissza
        </button>
        <button 
          onClick={onConfirm}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Foglalás Véglegesítése
        </button>
      </div>
    </div>
  );
};

export default AppointmentSummary; 