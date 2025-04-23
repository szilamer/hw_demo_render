import React, { useEffect, useRef, useState } from 'react';
import { Timeline as VisTimeline } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import DocumentViewer from './DocumentViewer';
import EventForm from './EventForm';

export interface Document {
  id: string;
  title: string;
  url: string;
  type: string;
}

export interface TimelineItem {
  id: string;
  content: string;
  start: Date;
  documents?: Document[];
  description?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  onSelect: (itemId: string | null) => void;
  onRangeChange?: (start: Date, end: Date) => void;
  onAddEvent?: (event: TimelineItem) => void;
}

interface TimeWindow {
  start: Date;
  end: Date;
}

interface TimelineSelectProperties {
  items?: string[];
  event?: Event;
}

const Timeline: React.FC<TimelineProps> = ({ 
  items, 
  onSelect, 
  onRangeChange, 
  onAddEvent 
}: TimelineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<VisTimeline | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [timeWindow, setTimeWindow] = useState<TimeWindow | null>(null);
  const [showDocumentList, setShowDocumentList] = useState(false);
  const [selectedItemDocs, setSelectedItemDocs] = useState<Document[]>([]);

  // Timeline inicializálása
  useEffect(() => {
    const initializeTimeline = () => {
      if (!containerRef.current || items.length === 0) return;

      // Dátumok számítása
      const dates = items.map(item => item.start.getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));

      // Dataset létrehozása
      const dataset = new DataSet(
        items.map((item: TimelineItem) => ({
          id: item.id,
          content: item.content,
          start: item.start
        }))
      );

      // Timeline opciók
      const options = {
        height: '180px',
        margin: {
          item: {
            horizontal: 15,
            vertical: 8
          },
          axis: 8
        },
        orientation: 'top',
        zoomable: true,
        moveable: true,
        showCurrentTime: false,
        width: '98%',
        stack: true,
        stackSubgroups: true,
        verticalScroll: true,
        horizontalScroll: true,
        maxHeight: '180px',
        minHeight: 180,
        autoResize: true
      };

      try {
        // Timeline létrehozása
        if (timelineRef.current) {
          timelineRef.current.destroy();
          timelineRef.current = null;
        }

        const timeline = new VisTimeline(containerRef.current, dataset, options);
        timelineRef.current = timeline;

        // Ha van mentett időablak, állítsuk be
        if (timeWindow) {
          timeline.setWindow(timeWindow.start, timeWindow.end, {
            animation: false
          });
        } else {
          // Alapértelmezett időablak
          const windowStart = new Date(minDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          const windowEnd = new Date(maxDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          timeline.setWindow(windowStart, windowEnd, {
            animation: false
          });
        }

        // Eseménykezelők beállítása
        timeline.on('select', (properties: TimelineSelectProperties) => {
          if (properties.items && properties.items.length > 0) {
            const selectedId = properties.items[0].toString();
            handleItemClick(selectedId);
          } else {
            setShowDocumentList(false);
            setSelectedItemDocs([]);
            onSelect(null);
          }
        });

        // Időablak változás figyelése - throttle-olt verzió
        let timeoutId: ReturnType<typeof setTimeout>;
        timeline.on('rangechange', () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            const window = timeline.getWindow();
            const newWindow = {
              start: new Date(window.start.getTime()),
              end: new Date(window.end.getTime())
            };
            setTimeWindow(newWindow);
            if (onRangeChange) {
              onRangeChange(newWindow.start, newWindow.end);
            }
          }, 100);
        });

      } catch (error) {
        console.error('Timeline initialization error:', error);
      }
    };

    initializeTimeline();

    return () => {
      try {
        if (timelineRef.current) {
          timelineRef.current.destroy();
          timelineRef.current = null;
        }
      } catch (error) {
        console.error('Timeline cleanup error:', error);
      }
    };
  }, [items, onSelect, onRangeChange, timeWindow]);

  // Items frissítése
  useEffect(() => {
    if (!timelineRef.current || items.length === 0) return;

    // Dataset frissítése
    const dataset = new DataSet(
      items.map((item: TimelineItem) => ({
        id: item.id,
        content: item.content,
        start: item.start,
        title: item.description || item.content
      }))
    );

    // Dátumok frissítése
    const dates = items.map((item: TimelineItem) => item.start.getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    const windowStart = new Date(minDate);
    windowStart.setMonth(windowStart.getMonth() - 1);
    const windowEnd = new Date(maxDate);
    windowEnd.setMonth(windowEnd.getMonth() + 1);

    // Timeline frissítése
    timelineRef.current.setOptions({
      min: windowStart,
      max: windowEnd
    });
    
    timelineRef.current.setItems(dataset);
    
    // Időablak beállítása animációval
    timelineRef.current.setWindow(windowStart, windowEnd, {
      animation: {
        duration: 1000,
        easingFunction: 'easeInOutQuad'
      }
    });
  }, [items]);

  // Event handlers
  const handleMouseOver = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.vis-item') || !tooltipRef.current) return;

    const itemElement = target.closest('.vis-item') as HTMLElement;
    const itemId = itemElement.getAttribute('data-id');
    if (!itemId) return;

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const rect = itemElement.getBoundingClientRect();
    tooltipRef.current.innerHTML = `
      <div class="tooltip-content">
        <h3>${item.content}</h3>
        <p>Dátum: ${item.start.toLocaleDateString('hu-HU')}</p>
        ${item.description ? `<p>${item.description}</p>` : ''}
        ${item.documents && item.documents.length > 0 ? `
          <p>Kapcsolódó dokumentumok (duplakattintással megnyitható):</p>
          <ul>${item.documents.map(doc => `<li>${doc.title}</li>`).join('')}</ul>
        ` : ''}
      </div>
    `;
    
    tooltipRef.current.style.display = 'block';
    tooltipRef.current.style.left = `${rect.right + 10}px`;
    tooltipRef.current.style.top = `${rect.top}px`;
  };

  const handleMouseOut = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('.vis-item') && tooltipRef.current) {
      tooltipRef.current.style.display = 'none';
    }
  };

  const handleDoubleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.vis-item')) return;

    const itemElement = target.closest('.vis-item') as HTMLElement;
    const itemId = itemElement.getAttribute('data-id');
    if (!itemId) return;

    const item = items.find(i => i.id === itemId);
    if (item?.documents && item.documents.length > 0) {
      setSelectedDocument(item.documents[0]);
    }
  };

  const handleAddEvent = (event: {
    content: string;
    start: Date;
    documents: Document[];
  }) => {
    if (onAddEvent) {
      const newEvent: TimelineItem = {
        id: `event-${Date.now()}`,
        ...event
      };
      onAddEvent(newEvent);
    }
    setShowEventForm(false);
  };

  // Dokumentum lista megjelenítése
  const handleItemClick = (itemId: string) => {
    const item = items.find((i: TimelineItem) => i.id === itemId);
    if (item?.documents && item.documents.length > 0) {
      setSelectedItemDocs(item.documents);
      setShowDocumentList(true);
    }
    if (onSelect) {
      onSelect(itemId);
    }
  };

  // Dokumentum megnyitása
  const handleDocumentClick = (doc: Document) => {
    setSelectedDocument(doc);
  };

  return (
    <div 
      style={{ 
        width: '98%',
        padding: '8px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        margin: '5px auto',
        maxHeight: '220px',
        position: 'relative'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.2em' }}>Események időrendi sorrendben</h2>
        <button 
          onClick={() => setShowEventForm(true)}
          style={{
            padding: '4px 8px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9em'
          }}
        >
          + Új esemény
        </button>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <div 
          ref={containerRef} 
          style={{ 
            height: '180px',
            flex: '1',
            position: 'relative',
            border: '1px solid #eee',
            borderRadius: '4px'
          }} 
        />
        {showDocumentList && selectedItemDocs.length > 0 && (
          <div 
            style={{
              width: '250px',
              padding: '10px',
              background: '#f5f5f5',
              borderRadius: '4px',
              border: '1px solid #eee'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <h3 style={{ margin: 0, fontSize: '1em' }}>Kapcsolódó dokumentumok</h3>
              <button
                onClick={() => setShowDocumentList(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2em',
                  cursor: 'pointer',
                  padding: '0 5px',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '12px',
                  transition: 'background-color 0.2s',
                }}
                className="close-button"
              >
                ×
              </button>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: '150px' }}>
              {selectedItemDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleDocumentClick(doc)}
                  style={{
                    padding: '8px',
                    background: 'white',
                    borderRadius: '4px',
                    marginBottom: '5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ 
                    fontSize: '1.2em',
                    color: '#666'
                  }}>
                    {doc.type === 'pdf' ? '📄' : 
                     doc.type === 'image' ? '🖼️' : 
                     doc.type === 'text' ? '📝' : '📎'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 500 }}>{doc.title}</div>
                    <div style={{ 
                      fontSize: '0.8em',
                      color: '#666'
                    }}>
                      {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`
        .timeline-item {
          background-color: #4a90e2;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.9em;
        }
        .timeline-item-content {
          padding: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .vis-timeline {
          border: none !important;
        }
        .vis-item {
          border-color: #3a7abd;
          background-color: #4a90e2;
          color: white;
        }
        .vis-item.vis-selected {
          background-color: #357abd;
          border-color: #2a5a8d;
        }
        .vis-item.has-documents::after {
          content: '📎';
          position: absolute;
          right: 4px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.9em;
        }
        .close-button:hover {
          background-color: #e0e0e0;
        }
      `}</style>
      <div 
        ref={tooltipRef} 
        style={{ 
          display: 'none',
          position: 'absolute',
          zIndex: 1000,
          background: 'white',
          padding: '10px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }} 
      />
      
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {showEventForm && (
        <EventForm
          onSubmit={handleAddEvent}
          onClose={() => setShowEventForm(false)}
        />
      )}
    </div>
  );
};

export default Timeline; 