import React, { useState, useRef } from 'react';

interface EventFormProps {
  onSubmit: (event: {
    content: string;
    start: Date;
    documents: Array<{
      id: string;
      title: string;
      url: string;
      type: string;
    }>;
  }) => void;
  onClose: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ onSubmit, onClose }) => {
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [documents, setDocuments] = useState<File[]>([]);
  const [documentTitles, setDocumentTitles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const uploadedDocs = await Promise.all(
      documents.map(async (file, index) => {
        const fileName = `${Date.now()}-${file.name}`;
        const fileType = file.type.startsWith('image/') ? 'image' : 
                        file.type === 'application/pdf' ? 'pdf' : 'text';

        // Fájl másolása a documents könyvtárba
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', fileName);

        // Itt implementálni kell a fájl feltöltés logikáját
        // Egyelőre csak demo adatokat adunk vissza
        return {
          id: `doc${Date.now()}${index}`,
          title: documentTitles[index] || file.name,
          url: fileName,
          type: fileType
        };
      })
    );

    onSubmit({
      content,
      start: new Date(date),
      documents: uploadedDocs
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDocuments(prev => [...prev, ...files]);
    setDocumentTitles(prev => [...prev, ...files.map(() => '')]);
  };

  return (
    <div className="event-form-overlay">
      <div className="event-form-content">
        <div className="event-form-header">
          <h3>Új esemény felvétele</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-group">
            <label htmlFor="content">Esemény leírása:</label>
            <input
              type="text"
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="date">Dátum:</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Dokumentumok:</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="file-select-button"
            >
              Fájlok kiválasztása
            </button>
            {documents.map((doc, index) => (
              <div key={index} className="document-input">
                <span>{doc.name}</span>
                <input
                  type="text"
                  placeholder="Dokumentum címe"
                  value={documentTitles[index]}
                  onChange={(e) => {
                    const newTitles = [...documentTitles];
                    newTitles[index] = e.target.value;
                    setDocumentTitles(newTitles);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setDocuments(docs => docs.filter((_, i) => i !== index));
                    setDocumentTitles(titles => titles.filter((_, i) => i !== index));
                  }}
                >
                  Törlés
                </button>
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-button">Mentés</button>
            <button type="button" onClick={onClose} className="cancel-button">Mégse</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm; 