import React from 'react';

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
  // PDF elérési útvonal meghatározása - labor leletek és kórlapok kezelése
  const getDocumentPath = (url: string) => {
    // Ellenőrizzük, hogy labor lelet-e a dokumentum
    if (url.startsWith('lab_')) {
      return `/documents/${url}`;
    }
    // Egyébként a standard API végpont
    return `/api/documents/download/${url}`;
  };

  return (
    <div className="document-viewer-overlay">
      <div className="document-viewer-content">
        <div className="document-viewer-header">
          <h3>{document.title}</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        <div className="document-viewer-body">
          {document.type === 'pdf' ? (
            <iframe 
              src={getDocumentPath(document.url)} 
              width="100%" 
              height="500px" 
              title={document.title}
            />
          ) : document.type === 'image' ? (
            <img 
              src={getDocumentPath(document.url)} 
              alt={document.title} 
              style={{ maxWidth: '100%', maxHeight: '500px' }} 
            />
          ) : (
            <div className="text-content">
              {document.content || 'A dokumentum tartalma nem megjeleníthető'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer; 