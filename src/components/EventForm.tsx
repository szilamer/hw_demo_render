import React, { useState, useRef, useEffect } from 'react';
// Import types from Timeline.tsx instead of App.tsx
import { TimelineItem, Document } from './Timeline';

interface EventFormProps {
  onSubmit: (event: TimelineItem) => void; // Use TimelineItem type
  onClose: () => void;
  initialData?: TimelineItem | null; // Add initialData prop
}

const EventForm: React.FC<EventFormProps> = ({ onSubmit, onClose, initialData }) => {
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  // Store existing documents separately if editing
  const [existingDocuments, setExistingDocuments] = useState<Document[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newDocumentTitles, setNewDocumentTitles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false); // Add uploading state
  const [uploadError, setUploadError] = useState<string | null>(null); // Add error state

  useEffect(() => {
    if (initialData) {
      setContent(initialData.content);
      // Format date to YYYY-MM-DD for input type="date"
      const eventDate = new Date(initialData.start);
      const formattedDate = eventDate.toISOString().split('T')[0];
      setDate(formattedDate);
      setExistingDocuments(initialData.documents || []);
      // Reset new files when opening for edit
      setNewFiles([]);
      setNewDocumentTitles([]);
    } else {
      // Reset form if adding new
      setContent('');
      setDate('');
      setExistingDocuments([]);
      setNewFiles([]);
      setNewDocumentTitles([]);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true); // Start uploading
    setUploadError(null); // Clear previous errors

    const uploadedNewDocs: Document[] = [];
    let uploadFailed = false;

    try {
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const title = newDocumentTitles[i] || file.name;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);

        // Actual upload API call
        const response = await fetch('http://localhost:3001/api/documents/upload', { // Use correct backend URL
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          // Try to get error message from backend
          let errorMsg = `Hiba a(z) ${file.name} feltöltésekor: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch (jsonError) {
            // Ignore if response is not JSON
          }
          throw new Error(errorMsg);
        }

        const uploadedDocData: Document = await response.json(); // Expect backend to return Document structure
        uploadedNewDocs.push(uploadedDocData);
      }
    } catch (error: any) {
      console.error("Upload failed:", error);
      setUploadError(error.message || "Ismeretlen hiba a dokumentum feltöltése során.");
      uploadFailed = true;
    } finally {
      setIsUploading(false); // Finish uploading
    }

    // Only proceed if upload was successful
    if (!uploadFailed) {
      const eventData: TimelineItem = {
        id: initialData ? initialData.id : `event-${Date.now()}`,
        content,
        start: new Date(date),
        // Combine existing documents with newly uploaded ones
        documents: initialData ? [...existingDocuments, ...uploadedNewDocs] : uploadedNewDocs,
      };

      onSubmit(eventData); // Call onSubmit prop (which triggers handleAddEvent/handleUpdateEvent in App.tsx)
      onClose(); // Close the form on successful submit
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewFiles(prev => [...prev, ...files]);
    setNewDocumentTitles(prev => [...prev, ...files.map(() => '')]); // Add empty titles for new files
  };

  // Function to remove a newly selected file before upload
  const handleRemoveNewFile = (indexToRemove: number) => {
    setNewFiles(files => files.filter((_, i) => i !== indexToRemove));
    setNewDocumentTitles(titles => titles.filter((_, i) => i !== indexToRemove));
  };

  // Function to remove an existing document (needs backend call in real app)
  const handleRemoveExistingDocument = (idToRemove: string) => {
    // TODO: Implement API call to delete the document on the server
    // fetch(`/api/documents/delete/${docToDelete.url}`, { method: 'DELETE' });
    setExistingDocuments(docs => docs.filter(doc => doc.id !== idToRemove));
  };


  return (
    <div className="event-form-overlay">
      <div className="event-form-content">
        <div className="event-form-header">
          {/* Change title based on mode */}
          <h3>{initialData ? 'Esemény szerkesztése' : 'Új esemény felvétele'}</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        <form onSubmit={handleSubmit} className="event-form">
          {/* Content and Date inputs remain similar */}
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

          {/* Document Section */}
          <div className="form-group">
            <label>Dokumentumok:</label>

            {/* Display existing documents if editing */}
            {initialData && existingDocuments.length > 0 && (
              <div className="existing-documents-list">
                <h4>Meglévő dokumentumok:</h4>
                {existingDocuments.map((doc) => (
                  <div key={doc.id} className="document-item existing">
                    <span>{doc.title || doc.url} ({doc.type})</span>
                    {/* Add delete button for existing documents */}
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingDocument(doc.id)}
                       className="delete-button"
                    >
                      Törlés
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input for adding new documents */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              style={{ display: 'none' }}
              // Reset file input if needed, although might not be necessary
              // onClick={(event) => { (event.target as HTMLInputElement).value = ''; }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="file-select-button"
            >
              + Új dokumentum hozzáadása
            </button>

            {/* List newly selected files */}
            {newFiles.length > 0 && (
                <div className="new-documents-list">
                 <h4>Újonnan hozzáadandó dokumentumok:</h4>
                 {newFiles.map((file, index) => (
                    <div key={index} className="document-item new">
                        <span>{file.name}</span>
                        <input
                        type="text"
                        placeholder="Dokumentum címe (opcionális)"
                        value={newDocumentTitles[index]}
                        onChange={(e) => {
                            const newTitles = [...newDocumentTitles];
                            newTitles[index] = e.target.value;
                            setNewDocumentTitles(newTitles);
                        }}
                        />
                        <button
                        type="button"
                        onClick={() => handleRemoveNewFile(index)}
                        className="delete-button"
                        >
                        Mégse adja hozzá
                        </button>
                    </div>
                 ))}
                </div>
            )}
          </div>
          {/* End Document Section */}

          {/* Display upload error */}
          {uploadError && (
            <div className="form-error" style={{ color: 'red', marginBottom: '10px' }}>
              {uploadError}
            </div>
          )}

          <div className="form-actions">
            {/* Disable button while uploading */}
            <button type="submit" className="submit-button" disabled={isUploading}>
              {isUploading ? 'Feltöltés...' : (initialData ? 'Módosítások mentése' : 'Mentés')}
            </button>
            <button type="button" onClick={onClose} className="cancel-button" disabled={isUploading}>
              Mégse
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm; 