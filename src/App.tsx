import React, { useState, useRef, useEffect, useMemo } from 'react';
import Timeline, { TimelineItem } from './components/Timeline';
import Graph, { GraphNode, GraphEdge } from './components/Graph';
import ChatBox, { ChatBoxHandle } from './components/ChatBox';
import Calendar, { AppointmentEvent } from './components/Calendar';
import HealthMetrics from './components/HealthMetrics';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import AppointmentSummary from './components/AppointmentSummary.tsx';

// API végpontok
const CHAT_WEBHOOK_URL = process.env.REACT_APP_CHAT_WEBHOOK_URL || '/webhook/webhook';  // Chat üzenetek kezelése
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';  // API alap URL

// Fiktív beteg történetének adatai
const patientEvents: TimelineItem[] = [
  {
    id: '1',
    content: 'Első vizsgálat',
    start: new Date('2023-03-15'),
    documents: [
      { id: 'doc1', title: 'Első vizsgálati jegyzőkönyv', url: '#', type: 'examination' },
      { id: 'doc1a', title: 'Anamnézis felvétel', url: '#', type: 'anamnesis' }
    ]
  },
  {
    id: '2',
    content: 'Magas vérnyomás diagnózis',
    start: new Date('2023-03-15'),
    documents: [
      { id: 'doc1b', title: '24 órás vérnyomásmonitor eredmények', url: '#', type: 'diagnostic' },
      { id: 'doc1c', title: 'Diagnózis és terápiás terv', url: '#', type: 'treatment_plan' }
    ]
  },
  {
    id: '3',
    content: 'Vércukor vizsgálat',
    start: new Date('2023-04-02'),
    documents: [
      { id: 'doc2', title: 'Laboratóriumi eredmények', url: '#', type: 'lab_results' },
      { id: 'doc2a', title: 'Laborértékek elemzése', url: '#', type: 'analysis' }
    ]
  },
  {
    id: '4',
    content: 'Cukorbetegség diagnózis',
    start: new Date('2023-04-05'),
    documents: [
      { id: 'doc2b', title: 'OGTT vizsgálati eredmény', url: '#', type: 'diagnostic' },
      { id: 'doc2c', title: 'Diabétesz kezelési terv', url: '#', type: 'treatment_plan' }
    ]
  },
  {
    id: '5',
    content: 'Gyógyszerfelírás - Vérnyomáscsökkentő',
    start: new Date('2023-04-10'),
    documents: [
      { id: 'doc3a', title: 'Vérnyomáscsökkentő receptek', url: '#', type: 'prescription' },
      { id: 'doc3b', title: 'Gyógyszerszedési útmutató', url: '#', type: 'instructions' }
    ]
  },
  {
    id: '6',
    content: 'Gyógyszerfelírás - Inzulin',
    start: new Date('2023-04-10'),
    documents: [
      { id: 'doc3c', title: 'Diabétesz gyógyszerek receptjei', url: '#', type: 'prescription' },
      { id: 'doc3d', title: 'Vércukormérési napló', url: '#', type: 'monitoring' }
    ]
  },
  {
    id: '7',
    content: 'Dietetikai tanácsadás',
    start: new Date('2023-04-25'),
    documents: [
      { id: 'doc4', title: 'Részletes étkezési terv', url: '#', type: 'diet_plan' },
      { id: 'doc4a', title: 'Testmozgás terv', url: '#', type: 'exercise_plan' },
      { id: 'doc4b', title: 'Kalória számítási útmutató', url: '#', type: 'instructions' }
    ]
  },
  {
    id: '8',
    content: 'Kardiológiai vizsgálat',
    start: new Date('2023-05-12'),
    documents: [
      { id: 'doc5', title: 'EKG lelet', url: '#', type: 'diagnostic' },
      { id: 'doc5a', title: 'Szívultrahang eredmény', url: '#', type: 'diagnostic' },
      { id: 'doc5b', title: 'Kardiológiai szakvélemény', url: '#', type: 'report' }
    ]
  },
  {
    id: '9',
    content: 'Balkamra hipertrófia diagnózis',
    start: new Date('2023-05-15'),
    documents: [
      { id: 'doc5c', title: 'Kardiológiai diagnózis', url: '#', type: 'diagnostic' },
      { id: 'doc5d', title: 'További vizsgálati terv', url: '#', type: 'plan' }
    ]
  },
  {
    id: '10',
    content: 'Gyógyszerváltás - Új vérnyomáscsökkentő',
    start: new Date('2023-05-18'),
    documents: [
      { id: 'doc6', title: 'Új gyógyszer receptek', url: '#', type: 'prescription' },
      { id: 'doc6a', title: 'Gyógyszerváltás indoklása', url: '#', type: 'report' }
    ]
  },
  {
    id: '11',
    content: 'Kontroll vizsgálat',
    start: new Date('2023-06-20'),
    documents: [
      { id: 'doc7', title: 'Kontroll vizsgálati eredmények', url: '#', type: 'examination' },
      { id: 'doc7a', title: 'Laboreredmények', url: '#', type: 'lab_results' },
      { id: 'doc7b', title: 'Állapotváltozás értékelése', url: '#', type: 'evaluation' }
    ]
  },
  {
    id: '12',
    content: 'Szemészeti vizsgálat',
    start: new Date('2023-07-05'),
    documents: [
      { id: 'doc8', title: 'Szemészeti lelet', url: '#', type: 'examination' },
      { id: 'doc8a', title: 'Szemfenék fotók', url: '#', type: 'images' }
    ]
  },
  {
    id: '13',
    content: 'Retinopátia korai jeleinek diagnózisa',
    start: new Date('2023-07-05'),
    documents: [
      { id: 'doc8b', title: 'Retinopátia diagnózis', url: '#', type: 'diagnostic' },
      { id: 'doc8c', title: 'Követési terv', url: '#', type: 'plan' }
    ]
  },
  {
    id: '14',
    content: 'Inzulin adagolás módosítása',
    start: new Date('2023-07-10'),
    documents: [
      { id: 'doc9', title: 'Új gyógyszerelési terv', url: '#', type: 'prescription' },
      { id: 'doc9a', title: 'Vércukornapló értékelése', url: '#', type: 'evaluation' }
    ]
  },
  {
    id: '15',
    content: 'Éves kontroll vizsgálat',
    start: new Date('2024-03-20'),
    documents: [
      { id: 'doc10', title: 'Éves összefoglaló jelentés', url: '#', type: 'report' },
      { id: 'doc10a', title: 'Következő évi terv', url: '#', type: 'plan' },
      { id: 'doc10b', title: 'Összes laboreredmény', url: '#', type: 'lab_results' }
    ]
  }
];

// Betegségek és események gráf csomópontjai
const patientNodes: GraphNode[] = [
  // Betegségek
  { id: 'hbp', label: 'Magas vérnyomás', type: 'disease' },
  { id: 'diabetes', label: 'Cukorbetegség', type: 'disease' },
  { id: 'lvh', label: 'Balkamra hipertrófia', type: 'disease' },
  { id: 'retinopathy', label: 'Diabéteszes retinopátia', type: 'disease' },
  
  // Vizsgálatok és diagnózisok
  { id: 'first_exam', label: 'Első vizsgálat', type: 'event', timestamp: new Date('2023-03-01') },
  { id: 'hbp_diag', label: 'Magas vérnyomás diagnózis', type: 'event', timestamp: new Date('2023-03-01') },
  { id: 'blood_test', label: 'Vércukor vizsgálat', type: 'event', timestamp: new Date('2023-03-05') },
  { id: 'diabetes_diag', label: 'Cukorbetegség diagnózis', type: 'event', timestamp: new Date('2023-03-05') },
  { id: 'diet_consult', label: 'Dietetikai tanácsadás', type: 'event', timestamp: new Date('2023-03-15') },
  { id: 'cardio_exam', label: 'Kardiológiai vizsgálat', type: 'event', timestamp: new Date('2023-04-10') },
  { id: 'lvh_diag', label: 'Balkamra hipertrófia diagnózis', type: 'event', timestamp: new Date('2023-04-10') },
  { id: 'checkup', label: 'Kontroll vizsgálat', type: 'event', timestamp: new Date('2023-05-20') },
  { id: 'eye_exam', label: 'Szemészeti vizsgálat', type: 'event', timestamp: new Date('2023-07-05') },
  { id: 'retinopathy_diag', label: 'Retinopátia diagnózisa', type: 'event', timestamp: new Date('2023-07-05') },
  { id: 'annual_exam', label: 'Éves kontroll vizsgálat', type: 'event', timestamp: new Date('2024-03-20') },
  
  // Kezelések
  { id: 'hbp_med', label: 'Vérnyomáscsökkentő', type: 'event', timestamp: new Date('2023-03-10') },
  { id: 'insulin', label: 'Inzulin', type: 'event', timestamp: new Date('2023-03-10') },
  { id: 'new_hbp_med', label: 'Új vérnyomáscsökkentő', type: 'event', timestamp: new Date('2023-04-15') },
  { id: 'insulin_adj', label: 'Inzulin adagolás módosítása', type: 'event', timestamp: new Date('2023-07-10') }
];

// Kapcsolatok a betegségek és események között
const patientEdges: GraphEdge[] = [
  // Diagnosztikai útvonalak
  { from: 'first_exam', to: 'hbp_diag' },
  { from: 'hbp_diag', to: 'hbp' },
  { from: 'first_exam', to: 'blood_test' },
  { from: 'blood_test', to: 'diabetes_diag' },
  { from: 'diabetes_diag', to: 'diabetes' },
  
  // Kezelések
  { from: 'hbp', to: 'hbp_med' },
  { from: 'diabetes', to: 'insulin' },
  { from: 'diabetes', to: 'diet_consult' },
  
  // Szövődmények és további vizsgálatok
  { from: 'hbp', to: 'cardio_exam' },
  { from: 'cardio_exam', to: 'lvh_diag' },
  { from: 'lvh_diag', to: 'lvh' },
  { from: 'lvh', to: 'new_hbp_med' },
  { from: 'hbp_med', to: 'new_hbp_med', label: 'váltás' },
  
  // Kontrollok és követés
  { from: 'hbp', to: 'checkup' },
  { from: 'diabetes', to: 'checkup' },
  { from: 'diabetes', to: 'eye_exam' },
  { from: 'eye_exam', to: 'retinopathy_diag' },
  { from: 'retinopathy_diag', to: 'retinopathy' },
  { from: 'retinopathy', to: 'insulin_adj' },
  
  // Éves kontroll
  { from: 'hbp', to: 'annual_exam' },
  { from: 'diabetes', to: 'annual_exam' },
  { from: 'lvh', to: 'annual_exam' },
  { from: 'retinopathy', to: 'annual_exam' }
];

// Idővonalon kiválasztott esemény -> gráf csomópont megfeleltetés
const eventToNodeMap: Record<string, string> = {
  '1': 'first_exam',
  '2': 'hbp_diag',
  '3': 'blood_test',
  '4': 'diabetes_diag',
  '5': 'hbp_med',
  '6': 'insulin',
  '7': 'diet_consult',
  '8': 'cardio_exam',
  '9': 'lvh_diag',
  '10': 'new_hbp_med',
  '11': 'checkup',
  '12': 'eye_exam',
  '13': 'retinopathy_diag',
  '14': 'insulin_adj',
  '15': 'annual_exam'
};

// Gráf csomópont -> idővonalon kiválasztott esemény megfeleltetés
const nodeToEventMap: Record<string, string> = Object.entries(eventToNodeMap).reduce(
  (acc: Record<string, string>, [key, value]) => {
    acc[value] = key;
    return acc;
  }, 
  {}
);

interface AppointmentSlot extends AppointmentEvent {
  id: string;
  isSelected?: boolean;
}

// Szintetikus metrika-idősorok generálása
const metricTimeSeries = {
  'Vérnyomás': [
    { date: '2023-03-15', systolic: 165, diastolic: 95 },
    { date: '2023-04-10', systolic: 158, diastolic: 92 },
    { date: '2023-05-18', systolic: 142, diastolic: 85 },
    { date: '2023-07-10', systolic: 135, diastolic: 82 },
    { date: '2024-03-20', systolic: 130, diastolic: 80 }
  ],
  'Éhomi vércukor': [
    { date: '2023-04-02', value: 8.2 },
    { date: '2023-06-20', value: 6.8 },
    { date: '2024-03-20', value: 6.2 }
  ],
  'BMI': [
    { date: '2023-03-15', value: 30.9 },
    { date: '2023-06-20', value: 29.7 },
    { date: '2024-03-20', value: 28.1 }
  ],
  'Koleszterin': [
    { date: '2023-04-02', value: 6.2 },
    { date: '2023-06-20', value: 5.9 },
    { date: '2024-03-20', value: 5.4 }
  ],
  'Napi lépésszám': [
    { date: '2023-03-15', value: 4000 },
    { date: '2023-04-10', value: 6000 },
    { date: '2023-06-20', value: 8500 },
    { date: '2024-03-20', value: 10000 }
  ]
};

const metricDescriptions: Record<string, string> = {
  'Vérnyomás': 'A vérnyomás a keringési rendszer állapotát mutatja. A normál érték 120/80 mmHg körül van. A magas vérnyomás növeli a szív- és érrendszeri betegségek kockázatát.',
  'Éhomi vércukor': 'Az éhomi vércukor a cukorbetegség diagnosztikájában és követésében fontos. Normál értéke 3.9-5.5 mmol/L.',
  'BMI': 'A testtömegindex (BMI) a testsúly és a magasság arányát mutatja. 18,5-24,9 között normális, 25 felett túlsúlyos.',
  'Koleszterin': 'A koleszterin szint a szív- és érrendszeri kockázatot jelzi. Normál érték <5,2 mmol/L.',
  'Napi lépésszám': 'A napi lépésszám a fizikai aktivitás mérőszáma. Az ajánlott cél 8-10 ezer lépés naponta.'
};

const statusDescriptions = [
  { label: 'Normál', color: '#4CAF50', desc: 'Az érték az egészséges tartományban van.' },
  { label: 'Figyelmeztető', color: '#FFC107', desc: 'Az érték a normálistól eltér, de nem kritikus.' },
  { label: 'Kritikus', color: '#F44336', desc: 'Az érték jelentősen eltér a normálistól, orvosi beavatkozás szükséges lehet.' }
];

// A metrikák típusai
const metricKeys = ['Vérnyomás', 'BMI', 'Napi lépésszám', 'Éhomi vércukor', 'Koleszterin'] as const;
type MetricKey = typeof metricKeys[number];

const App: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showAllNodes, setShowAllNodes] = useState<boolean>(false);
  const [visibleTimeRange, setVisibleTimeRange] = useState<{start: Date, end: Date} | null>(null);
  const [communicationMode, setCommunicationMode] = useState<'text' | 'voice'>('text');
  const timeoutRef = useRef<number | null>(null);
  const lastTimeRangeRef = useRef<{start: Date, end: Date} | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [suggestedSlots, setSuggestedSlots] = useState<AppointmentSlot[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null);
  const chatboxRef = useRef<ChatBoxHandle>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [currentSlot, setCurrentSlot] = useState<AppointmentEvent | null>(null);
  const [appointmentSummary, setAppointmentSummary] = useState<string>('');
  const [events, setEvents] = useState<TimelineItem[]>(patientEvents);

  // Példa userId, reason, patientHistory (ezeket érdemes később dinamikusan kezelni)
  const userId = 'kovacs_istvan';
  const reason = 'Rendszeres kontroll vizsgálat';
  const patientHistory = {};

  // Idővonalon történő kiválasztás kezelése
  const handleTimelineSelect = (itemId: string | null) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (itemId === null) {
      // Ha nincs kiválasztott elem, visszaállunk az időtartomány alapú szűrésre
      setSelectedEvent(null);
      setSelectedNode(null);
      setShowAllNodes(false);
    } else {
      console.log('Kiválasztott idővonalas esemény:', itemId);
      setSelectedEvent(itemId);
      setShowAllNodes(false);
      
      // Kapcsolódó gráf csomópont kiválasztása
      const nodeId = eventToNodeMap[itemId];
      if (nodeId) {
        setSelectedNode(nodeId);
      }
    }
  };

  // Időintervallum változás kezelése debounce-olással
  const handleTimeRangeChange = (start: Date, end: Date) => {
    // Ellenőrizzük, hogy tényleg változott-e az időtartomány
    if (lastTimeRangeRef.current &&
        lastTimeRangeRef.current.start.getTime() === start.getTime() &&
        lastTimeRangeRef.current.end.getTime() === end.getTime()) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    lastTimeRangeRef.current = { start, end };

    timeoutRef.current = window.setTimeout(() => {
      setVisibleTimeRange({ start, end });
      if (selectedEvent) {
        // Csak akkor töröljük a kiválasztást, ha az esemény időpontja
        // kívül esik a látható tartományon
        const selectedEventData = patientEvents.find(e => e.id === selectedEvent);
        if (selectedEventData &&
            (selectedEventData.start < start || selectedEventData.start > end)) {
          setSelectedEvent(null);
          setSelectedNode(null);
        }
      }
    }, 300);
  };

  // Gráfban történő kiválasztás kezelése
  const handleGraphSelect = (nodeId: string) => {
    console.log('Kiválasztott gráf csomópont:', nodeId);
    setSelectedNode(nodeId);
    
    // Kapcsolódó idővonalas esemény kiválasztása
    const eventId = nodeToEventMap[nodeId];
    if (eventId) {
      setSelectedEvent(eventId);
    }
  };

  // Cleanup a timeout-hoz
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Memoizáljuk a látható node-okat
  const visibleNodes = useMemo(() => {
    if (showAllNodes) return patientNodes;
    
    if (selectedEvent) {
      const selectedTimelineEvent = patientEvents.find(e => e.id === selectedEvent);
      if (!selectedTimelineEvent) return [];

      const selectedDate = selectedTimelineEvent.start;
      
      return patientNodes.filter(node => {
        if (node.type === 'disease') {
          return patientEdges.some(edge => {
            const connectedEventNode = patientNodes.find(n => 
              (edge.from === node.id || edge.to === node.id) && 
              (edge.from === nodeToEventMap[selectedEvent] || edge.to === nodeToEventMap[selectedEvent])
            );
            return connectedEventNode !== undefined;
          });
        } else {
          return node.timestamp?.getTime() === selectedDate.getTime();
        }
      });
    } else if (visibleTimeRange) {
      return patientNodes.filter(node => {
        if (node.type === 'disease') {
          return patientEdges.some(edge => {
            const connectedEventNode = patientNodes.find(n => 
              (edge.from === node.id || edge.to === node.id) && 
              n.type === 'event' &&
              n.timestamp &&
              n.timestamp >= visibleTimeRange.start &&
              n.timestamp <= visibleTimeRange.end
            );
            return connectedEventNode !== undefined;
          });
        } else {
          return node.timestamp && 
                 node.timestamp >= visibleTimeRange.start && 
                 node.timestamp <= visibleTimeRange.end;
        }
      });
    }
    
    return patientNodes;
  }, [selectedEvent, visibleTimeRange, showAllNodes]);

  // Memoizáljuk a látható éleket
  const visibleEdges = useMemo(() => {
    if (showAllNodes) return patientEdges;
    
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    return patientEdges.filter(edge => 
      visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to)
    );
  }, [visibleNodes, showAllNodes]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Itt implementálhatjuk a fájl feltöltés logikáját
      console.log('Fájl kiválasztva:', file.name);
    }
  };

  // Demo időpontok generálása
  const generateDemoSlots = (): AppointmentSlot[] => {
    const now = new Date();
    const slots: AppointmentSlot[] = [];
    
    // Következő 3 munkanap, 10:00-kor
    for (let i = 1; i <= 5; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      date.setHours(10, 0, 0, 0);
      
      // Csak munkanapokon (1-5: hétfő-péntek)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        slots.push({
          title: 'Szabad időpont',
          start: new Date(date),
          end: new Date(date.setHours(11, 0, 0, 0)),
          isAvailable: true,
          id: `slot-${date.toISOString()}`
        });
        
        if (slots.length === 3) break;
      }
    }
    
    return slots;
  };

  // Debug useEffect a showCalendar állapot változásának követéséhez
  useEffect(() => {
    console.log('showCalendar changed:', showCalendar);
    console.log('selectedMetric:', selectedMetric);
  }, [showCalendar, selectedMetric]);

  const openAppointmentCalendar = async () => {
    console.log('openAppointmentCalendar called');
    const slots = generateDemoSlots();
    console.log('Generated slots:', slots);
    
    // Először állítsuk vissza a selectedMetric-et
    setSelectedMetric(null);
    
    // Várjunk egy kicsit, hogy a selectedMetric változás érvényesüljön
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Most állítsuk be a showCalendar-t és a slotokat
    setShowCalendar(true);
    setSuggestedSlots(slots);
    
    console.log('Calendar state updated:', {
      showCalendar: true,
      slots: slots,
      selectedMetric: null
    });
    
    return true;
  };

  const handleSendMessage = async (message: string, callback: (response: string) => void) => {
    try {
      // Formázott metrika objektum létrehozása
      const currentMetric = selectedMetric ? healthMetrics.find(m => m.title === selectedMetric) : null;
      const formattedMetric = currentMetric ? {
        name: currentMetric.title,
        value: currentMetric.value,
        unit: currentMetric.unit,
        status: currentMetric.status,
        description: selectedMetric ? metricDescriptions[selectedMetric] : ''
      } : null;

      // Formázott esemény objektum létrehozása
      const currentEvent = selectedEvent ? patientEvents.find(e => e.id === selectedEvent) : null;
      const formattedEvent = currentEvent ? {
        content: currentEvent.content,
        start: format(new Date(currentEvent.start), 'yyyy-MM-dd'),
        documents: currentEvent.documents
      } : null;

      // Formázott csomópont objektum létrehozása
      const currentNode = selectedNode ? patientNodes.find(n => n.id === selectedNode) : null;
      const formattedNode = currentNode ? {
        id: currentNode.id,
        label: currentNode.label,
        type: currentNode.type,
        timestamp: currentNode.timestamp ? format(currentNode.timestamp, 'yyyy-MM-dd') : undefined
      } : null;

      // Kapcsolódó csomópontok keresése
      const relatedNodes = selectedNode ? 
        patientNodes.filter(node => 
          patientEdges.some(edge => 
            (edge.from === selectedNode && edge.to === node.id) || 
            (edge.to === selectedNode && edge.from === node.id)
          )
        ).map(node => ({
          id: node.id,
          label: node.label,
          type: node.type
        })) : [];

      const requestBody = {
        message: message,
        timestamp: new Date().toISOString(),
        context: {
          selectedMetric: formattedMetric,
          selectedEvent: formattedEvent,
          selectedNode: formattedNode,
          relatedNodes: relatedNodes,
          visibleNodes: visibleNodes.map(node => ({
            id: node.id,
            label: node.label,
            type: node.type
          })),
          visibleEdges: visibleEdges.map(edge => ({
            from: edge.from,
            to: edge.to,
            label: edge.label
          }))
        }
      };

      console.log('Küldés a webhooknak:', requestBody);

      const response = await fetch(CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('Válasz a webhoktól:', data);

      // Ellenőrizzük, hogy van-e válasz egyáltalán
      if (!data) {
        throw new Error('Üres válasz érkezett a szervertől');
      }

      // Ha string a válasz, ellenőrizzük, hogy calendar-related szöveg-e
      if (typeof data.response === 'string') {
        const response = data.response.toLowerCase();
        console.log('Válasz szöveg ellenőrzése:', response);
        
        // Ha a válasz tartalmazza a naptárral kapcsolatos kulcsszavakat
        if (response.includes('naptár') || response.includes('időpont')) {
          console.log('Naptár-related válasz detektálva, naptár megnyitása...');
          const success = await openAppointmentCalendar();
          console.log('Naptár megnyitás eredménye:', success);
          if (success) {
            callback(data.response);
          } else {
            callback('Sajnos nem sikerült megnyitni a naptárat. Kérem, próbálja újra.');
          }
          return;
        }
        
        // Ha nem naptár-related, egyszerűen visszaadjuk a választ
        callback(data.response);
        return;
      }

      // Ha van message vagy output property, azt használjuk
      if (data.message) {
        callback(data.message);
        return;
      }

      if (data.output) {
        callback(data.output);
        return;
      }

      // Fallback válasz
      callback('Sajnos nem kaptam értelmezhető választ.');

    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      callback('Sajnos hiba történt az üzenet feldolgozása során.');
    }
  };

  const handleSlotSelect = async (slot: AppointmentEvent) => {
    try {
      setCurrentSlot(slot);
      
      // Bővített üzenet a felhasználónak
      chatboxRef.current?.addMessage(
        `Időpont kiválasztva: ${format(new Date(slot.start), 'yyyy-MM-dd HH:mm')}\nKérem várjon, amíg elkészül a vizsgálat előkészítő dokumentum, amit a kezelőorvosa fog megkapni.`, 
        'user'
      );

      const response = await fetch(CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: "date_selected",
          slot: {
            start: format(new Date(slot.start), 'yyyy-MM-dd HH:mm'),
            end: format(new Date(slot.end), 'yyyy-MM-dd HH:mm'),
            title: slot.title
          },
          context: {
            selectedMetric: selectedMetric ? {
              name: healthMetrics.find(m => m.title === selectedMetric)?.title,
              value: healthMetrics.find(m => m.title === selectedMetric)?.value,
              unit: healthMetrics.find(m => m.title === selectedMetric)?.unit,
              status: healthMetrics.find(m => m.title === selectedMetric)?.status,
              description: selectedMetric ? metricDescriptions[selectedMetric] : null
            } : null,
            selectedEvent: selectedEvent ? {
              content: patientEvents.find(e => e.id === selectedEvent)?.content,
              start: selectedEvent ? format(new Date(patientEvents.find(e => e.id === selectedEvent)?.start || ''), 'yyyy-MM-dd') : null,
              documents: patientEvents.find(e => e.id === selectedEvent)?.documents
            } : null,
            selectedNode: selectedNode ? {
              id: patientNodes.find(n => n.id === selectedNode)?.id,
              label: patientNodes.find(n => n.id === selectedNode)?.label,
              type: patientNodes.find(n => n.id === selectedNode)?.type
            } : null,
            visibleNodes: visibleNodes.map(node => ({
              id: node.id,
              label: node.label,
              type: node.type
            })),
            visibleEdges: visibleEdges.map(edge => ({
              from: edge.from,
              to: edge.to,
              label: edge.label
            }))
          }
        })
      });

      const data = await response.json();
      
      if (data.response) {
        chatboxRef.current?.addMessage(data.response, 'assistant');
        
        if (data.summary) {
          setAppointmentSummary(data.summary);
          setShowCalendar(false);
          setShowSummary(true);
        }
      }

    } catch (error) {
      console.error('Error:', error);
      chatboxRef.current?.addMessage(
        'Hiba történt az időpontfoglalás során.',
        'assistant'
      );
    }
  };

  const handleConfirmAppointment = async () => {
    try {
      const response = await fetch(CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: "Időpontfoglalás véglegesítése",
          action: "confirm_booking",
          slot: currentSlot,
          summary: appointmentSummary,
          context: {
            selectedMetric: selectedMetric,
            selectedEvent: selectedEvent ? patientEvents.find(e => e.id === selectedEvent) : null,
            selectedNode: selectedNode ? patientNodes.find(n => n.id === selectedNode) : null,
            visibleNodes: visibleNodes,
            visibleEdges: visibleEdges
          }
        })
      });

      const data = await response.json();
      
      if (data.status === "success") {
        chatboxRef.current?.addMessage(
          'Az időpontfoglalás sikeresen véglegesítve.',
          'assistant'
        );
        setShowSummary(false);
      }

    } catch (error) {
      console.error('Error:', error);
      chatboxRef.current?.addMessage(
        'Hiba történt az időpontfoglalás véglegesítése során.',
        'assistant'
      );
    }
  };

  // Demo egészségügyi mérőszámok
  const healthMetrics = [
    {
      icon: '🫀',
      title: 'Vérnyomás',
      value: '145/95',
      unit: 'mmHg',
      status: 'warning'
    },
    {
      icon: '⚖️',
      title: 'BMI',
      value: '27.5',
      unit: 'kg/m²',
      status: 'warning'
    },
    {
      icon: '👣',
      title: 'Napi lépésszám',
      value: '8500',
      unit: 'lépés',
      status: 'normal'
    },
    {
      icon: '🩸',
      title: 'Éhomi vércukor',
      value: '7.2',
      unit: 'mmol/L',
      status: 'critical'
    },
    {
      icon: '🔬',
      title: 'Koleszterin',
      value: '5.8',
      unit: 'mmol/L',
      status: 'warning'
    }
  ];

  // Az aktuális metrika (ha nincs kiválasztva, az első)
  const currentMetric = selectedMetric || metricKeys[0];
  const currentMetricObj = healthMetrics.find(m => m.title === currentMetric);
  const currentStatus = currentMetricObj?.status || 'normal';
  const currentStatusObj = statusDescriptions.find(s => s.label.toLowerCase() === (currentStatus === 'normal' ? 'normál' : currentStatus === 'warning' ? 'figyelmeztető' : 'kritikus').toLowerCase());

  const handleAddEvent = async (event: TimelineItem) => {
    // Dokumentumok mentése a documents könyvtárba
    const savedDocuments = await Promise.all(
      (event.documents || []).map(async (doc) => {
        // Itt implementálni kell a fájl mentés logikáját
        // Egyelőre csak visszaadjuk a dokumentumot
        return doc;
      })
    );

    const newEvent = {
      ...event,
      documents: savedDocuments
    };

    setEvents(prevEvents => [...prevEvents, newEvent]);

    // Frissítjük a gráf csomópontokat és éleket is
    const newNode: GraphNode = {
      id: `event_${event.id}`,
      label: event.content,
      type: 'event',
      timestamp: event.start
    };

    // Itt lehetne implementálni a gráf frissítését is
    // ...
  };

  return (
    <div className="app-container">
      <div className="header-container">
        <h1>Kovács István betegségtörténete</h1>
        <div className="patient-info">
          <div className="basic-info">
            52 éves férfi, 2023 márciusában diagnosztizált magas vérnyomással és cukorbetegséggel
          </div>
        </div>
      </div>
      <div className="metrics-container">
        {healthMetrics.map((metric, index) => (
          <div key={index} className="metric-box" onClick={() => setSelectedMetric(metric.title as MetricKey)} style={{ cursor: 'pointer' }}>
            <div className="metric-icon">{metric.icon}</div>
            <div className="metric-title">{metric.title}</div>
            <div className="metric-value">
              {metric.value} {metric.unit}
            </div>
            <div className={`metric-status status-${metric.status}`}>
              {metric.status === 'normal' ? 'Normál' : 
               metric.status === 'warning' ? 'Figyelmeztető' : 'Kritikus'}
            </div>
          </div>
        ))}
      </div>
      <div className="timeline-container" style={{ marginBottom: 40, position: 'relative' }}>
        {selectedMetric ? (
          <div style={{ 
            position: 'absolute', 
            left: 15, 
            right: 15, 
            top: 15, 
            height: 180, 
            background: 'white', 
            borderRadius: 12, 
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)', 
            padding: '20px', 
            overflow: 'hidden', 
            zIndex: 2 
          }}>
            <button className="button" style={{ position: 'absolute', right: 10, top: 10 }} onClick={() => setSelectedMetric(null)}>
              Vissza az eseményekhez
            </button>
            <h3 style={{ marginBottom: 10, textAlign: 'center', fontWeight: 600, fontSize: 20 }}>{selectedMetric} időbeli alakulása</h3>
            <div style={{ width: '100%', paddingRight: 20 }}>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={metricTimeSeries[selectedMetric as MetricKey] || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" domain={['auto', 'auto']} />
                  {selectedMetric === 'Vérnyomás' ? (
                    <>
                      <Line yAxisId="left" type="monotone" dataKey="systolic" stroke="#e53935" name="Szisztolés" />
                      <Line yAxisId="left" type="monotone" dataKey="diastolic" stroke="#1e88e5" name="Diasztolés" />
                    </>
                  ) : (
                    <Line yAxisId="left" type="monotone" dataKey="value" stroke="#43a047" name={selectedMetric} />
                  )}
                  <Tooltip formatter={(value: any, name: string) => [`${value}`, name]} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <Timeline
            items={events}
            onSelect={handleTimelineSelect}
            onRangeChange={handleTimeRangeChange}
            onAddEvent={handleAddEvent}
          />
        )}
      </div>
      <div className="main-content">
        <div className="graph-container" style={{ position: 'relative' }}>
          {showCalendar ? (
            <div style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'white',
              zIndex: 1000,
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <Calendar 
                onBack={() => {
                  setShowCalendar(false);
                  setSuggestedSlots([]);
                }}
                suggestedSlots={suggestedSlots}
                onSelectSlot={handleSlotSelect}
              />
            </div>
          ) : showSummary && currentSlot ? (
            <div style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'white',
              zIndex: 1000,
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <AppointmentSummary
                slot={currentSlot}
                summary={appointmentSummary}
                onConfirm={handleConfirmAppointment}
                onCancel={() => {
                  setShowSummary(false);
                  setShowCalendar(true);
                }}
              />
            </div>
          ) : (
            <>
              <div className="graph-header">
                {selectedMetric ? (
                  <div style={{ background: '#e3eafc', textAlign: 'center', fontWeight: 700, fontSize: 22, marginBottom: 8, borderRadius: 8, padding: '10px 0' }}>
                    Állapotjelzések magyarázata
                  </div>
                ) : (
                  <>
                    <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
                      Betegségek és események kapcsolata
                    </h2>
                    {selectedEvent && (
                      <button 
                        className="button reset-view-button"
                        onClick={() => {
                          setSelectedEvent(null);
                          setSelectedNode(null);
                          setShowAllNodes(false);
                        }}
                      >
                        🔄 Összes kapcsolat mutatása
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="graph-inner">
                {showCalendar ? (
                  <Calendar 
                    onBack={() => {
                      setShowCalendar(false);
                      setSuggestedSlots([]);
                    }}
                    suggestedSlots={suggestedSlots}
                    onSelectSlot={handleSlotSelect}
                  />
                ) : selectedMetric ? (
                  <div style={{ margin: '0 0 20px 0', background: '#f8f9fa', borderRadius: 8, padding: 20, fontSize: 15 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="metric-icon" style={{ fontSize: '24px' }}>
                          {healthMetrics.find(m => m.title === selectedMetric)?.icon}
                        </div>
                        <h3 style={{ margin: 0 }}>{metricDescriptions[selectedMetric]}</h3>
                      </div>
                      <button onClick={() => setSelectedMetric(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5 }}>×</button>
                    </div>
                    <div style={{ marginTop: 20 }}>
                      <div style={{ 
                        marginBottom: 20, 
                        padding: 15, 
                        borderRadius: 8,
                        backgroundColor: currentStatusObj?.color + '10',
                        borderLeft: `4px solid ${currentStatusObj?.color}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <div style={{ fontWeight: 'bold' }}>
                          Aktuális érték: {healthMetrics.find(m => m.title === selectedMetric)?.value} {healthMetrics.find(m => m.title === selectedMetric)?.unit}
                        </div>
                        <div style={{ 
                          color: currentStatusObj?.color,
                          fontWeight: 'bold'
                        }}>
                          ({currentStatusObj?.label})
                        </div>
                      </div>
                      <h4 style={{ marginBottom: 15 }}>Állapotjelzések magyarázata:</h4>
                      {statusDescriptions.map((status, index) => (
                        <div key={index} style={{ 
                          marginBottom: 10, 
                          padding: 10, 
                          borderRadius: 4,
                          backgroundColor: status.color + '10',
                          borderLeft: `4px solid ${status.color}`
                        }}>
                          <div style={{ fontWeight: 'bold', color: status.color }}>{status.label}</div>
                          <div>{status.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Graph
                    nodes={visibleNodes}
                    edges={visibleEdges}
                    onSelect={handleGraphSelect}
                  />
                )}
              </div>
            </>
          )}
        </div>
        <div className="chatbox-container">
          <div className="ibr-header">
            <h2>Intelligens Betegtámogató Rendszer</h2>
            <div className="mode-switch">
              <button 
                className={`mode-button ${communicationMode === 'text' ? 'active' : ''}`}
                onClick={() => setCommunicationMode('text')}
              >
                ✍️ Szöveges
              </button>
              <button 
                className={`mode-button ${communicationMode === 'voice' ? 'active' : ''}`}
                onClick={() => setCommunicationMode('voice')}
              >
                🎤 Hangalapú
              </button>
            </div>
          </div>
          <div className="chatbox-inner">
            {communicationMode === 'text' ? (
              <ChatBox
                ref={chatboxRef}
                selectedEvent={selectedEvent}
                selectedNode={selectedNode}
                onSendMessage={handleSendMessage}
              />
            ) : (
              <div className="voice-mode">
                <button className="voice-button">
                  🎤
                </button>
                <p>Kattints a mikrofonra a beszélgetés indításához</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="info-bar">
        <div className="file-upload-button">
          <input
            type="file"
            id="file-upload"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <label htmlFor="file-upload" className="button">
            📎 Fájl feltöltése
          </label>
        </div>
        <button className="button appointment-button" onClick={openAppointmentCalendar}>
          📅 Időpontfoglalás
        </button>
      </div>
    </div>
  );
};

export default App;