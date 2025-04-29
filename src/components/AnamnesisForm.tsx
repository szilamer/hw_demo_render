import React, { useState } from 'react';

interface AnamnesisFormProps {
  summary: string;
  onSubmit: (additionalInfo: {
    currentSymptoms: string;
    medicationChanges: string;
    lifestyleChanges: string;
  }) => void;
  onDownload: () => void;
  isSubmitted: boolean;
}

const AnamnesisForm: React.FC<AnamnesisFormProps> = ({
  summary,
  onSubmit,
  onDownload,
  isSubmitted
}) => {
  const [currentSymptoms, setCurrentSymptoms] = useState('');
  const [medicationChanges, setMedicationChanges] = useState('');
  const [lifestyleChanges, setLifestyleChanges] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      currentSymptoms,
      medicationChanges,
      lifestyleChanges
    });
  };

  // Formázott összefoglaló létrehozása
  const formattedSummary = summary.split('\n').map((line, index) => {
    if (line.startsWith('=')) return null; // Kihagyjuk a === elválasztókat
    if (line.startsWith('-')) return null; // Kihagyjuk a --- elválasztókat
    
    if (line.endsWith(':')) {
      return <h3 key={index} style={{ 
        color: '#2c3e50',
        marginTop: '20px',
        marginBottom: '10px',
        fontSize: '1.2rem'
      }}>{line}</h3>;
    }
    
    if (line.toUpperCase() === line && line.trim().length > 0) {
      return <h2 key={index} style={{
        color: '#4e73df',
        marginTop: '25px',
        marginBottom: '15px',
        fontSize: '1.4rem',
        borderBottom: '2px solid #4e73df',
        paddingBottom: '8px'
      }}>{line}</h2>;
    }

    // Listaelemek kezelése
    if (line.trim().startsWith('- ')) {
      return <li key={index} style={{
        marginBottom: '8px',
        color: '#2c3e50',
        lineHeight: '1.6'
      }}>{line.substring(2)}</li>;
    }

    if (line.trim().match(/^\d+\./)) {
      return <li key={index} style={{
        marginBottom: '8px',
        color: '#2c3e50',
        lineHeight: '1.6'
      }}>{line}</li>;
    }

    return line.trim() ? <p key={index} style={{
      marginBottom: '10px',
      color: '#2c3e50',
      lineHeight: '1.6'
    }}>{line}</p> : <br key={index} />;
  });

  if (isSubmitted) {
    return (
      <div className="anamnesis-form-container" style={{
        padding: '30px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div className="success-message">
          <h3 style={{ color: '#2ecc71', marginBottom: '15px' }}>Köszönjük az időpontfoglalását!</h3>
          <p style={{ marginBottom: '20px', color: '#34495e' }}>A beküldött anamnézisét letöltheti az alábbi gombra kattintva:</p>
          <button 
            className="button download-button"
            onClick={onDownload}
            style={{
              backgroundColor: '#4e73df',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>📥</span> Letöltés
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="anamnesis-form-container" style={{
      padding: '30px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      maxWidth: '100%',
      margin: '0 auto'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ 
          color: '#4e73df',
          fontSize: '1.8rem',
          margin: 0
        }}>Vizsgálati Előkészítő</h2>
        <button
          onClick={onDownload}
          style={{
            backgroundColor: '#4e73df',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2e59d9'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4e73df'}
        >
          <span>📥</span> Összefoglaló letöltése
        </button>
      </div>

      <div className="summary-section" style={{
        backgroundColor: '#f8f9fc',
        padding: '25px',
        borderRadius: '8px',
        marginBottom: '30px',
        border: '1px solid #e3e6f0'
      }}>
        {formattedSummary}
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: '30px' }}>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="currentSymptoms" style={{
            display: 'block',
            marginBottom: '8px',
            color: '#34495e',
            fontWeight: 500
          }}>
            Jelenlegi tünetek és panaszok:
          </label>
          <textarea
            id="currentSymptoms"
            value={currentSymptoms}
            onChange={(e) => setCurrentSymptoms(e.target.value)}
            required
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e3e6f0',
              borderRadius: '4px',
              fontSize: '14px',
              lineHeight: '1.5',
              resize: 'vertical'
            }}
            placeholder="Kérjük, írja le részletesen jelenlegi tüneteit és panaszait..."
          />
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="medicationChanges" style={{
            display: 'block',
            marginBottom: '8px',
            color: '#34495e',
            fontWeight: 500
          }}>
            Gyógyszerelésben történt változások:
          </label>
          <textarea
            id="medicationChanges"
            value={medicationChanges}
            onChange={(e) => setMedicationChanges(e.target.value)}
            required
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e3e6f0',
              borderRadius: '4px',
              fontSize: '14px',
              lineHeight: '1.5',
              resize: 'vertical'
            }}
            placeholder="Kérjük, írja le ha történt változás a gyógyszerelésében..."
          />
        </div>

        <div className="form-group" style={{ marginBottom: '30px' }}>
          <label htmlFor="lifestyleChanges" style={{
            display: 'block',
            marginBottom: '8px',
            color: '#34495e',
            fontWeight: 500
          }}>
            Életmódbeli változások:
          </label>
          <textarea
            id="lifestyleChanges"
            value={lifestyleChanges}
            onChange={(e) => setLifestyleChanges(e.target.value)}
            required
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e3e6f0',
              borderRadius: '4px',
              fontSize: '14px',
              lineHeight: '1.5',
              resize: 'vertical'
            }}
            placeholder="Kérjük, írja le ha történtek változások az életmódjában..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
          <button 
            type="submit" 
            style={{
              backgroundColor: '#2ecc71',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#27ae60'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2ecc71'}
          >
            Időpontfoglalás véglegesítése
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnamnesisForm; 