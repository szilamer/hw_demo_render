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
  // PDF elérési útvonal meghatározása
  const getDocumentPath = (url: string) => {
    // Feltételezzük, hogy a szerver a /documents/ útvonal alatt szolgálja ki
    // a Dockerfile-ban másolt /app/src/documents tartalmát.
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `/documents/${cleanUrl}`;
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
              height="600px" 
              title={document.title}
              style={{ border: 'none' }}
            />
          ) : document.type === 'image' ? (
            <img 
              src={getDocumentPath(document.url)} 
              alt={document.title} 
              style={{ maxWidth: '100%', maxHeight: '600px', display: 'block', margin: '0 auto' }} 
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