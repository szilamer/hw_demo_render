import React, { useState, useEffect } from 'react';

interface Document {
  id: string;
  title: string;
  url: string;
  type: string;
  content?: string;
}

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, onClose }) => {
  const [error, setError] = useState<string | null>(null);

  const handleLoadError = () => {
    console.error('Document loading error:', {
      url: document.url,
      type: document.type
    });
    setError('A dokumentum betöltése sikertelen. Kérem ellenőrizze, hogy a fájl létezik és megfelelő formátumú.');
  };

  return (
    <div className="document-viewer-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="document-viewer-content" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '1200px',
        maxHeight: '95vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div className="document-viewer-header" style={{
          padding: '15px 20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
            {document.title}
          </h3>
          <button 
            onClick={onClose} 
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '5px',
              color: '#666',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#eee'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>
        <div className="document-viewer-body" style={{
          padding: '20px',
          overflow: 'auto',
          height: 'calc(95vh - 70px)'
        }}>
          {error ? (
            <div style={{
              padding: '20px',
              backgroundColor: '#fff3f3',
              color: '#d32f2f',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              {error}
              <br />
              <small style={{ display: 'block', marginTop: '10px', color: '#666' }}>
                Dokumentum adatok: {document.title} ({document.type})
              </small>
            </div>
          ) : document.type === 'pdf' ? (
            <iframe 
              src={`http://localhost:3001/api/documents/download/${document.url}`}
              width="100%" 
              height="100%"
              title={document.title}
              style={{ border: 'none' }}
              onError={handleLoadError}
            />
          ) : document.type === 'image' ? (
            <img 
              src={`http://localhost:3001/api/documents/download/${document.url}`}
              alt={document.title} 
              style={{ maxWidth: '100%', maxHeight: 'calc(95vh - 120px)', objectFit: 'contain' }}
              onError={handleLoadError}
            />
          ) : (
            <div className="text-content" style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap'
            }}>
              {document.content || 'A dokumentum tartalma nem megjeleníthető'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer; 