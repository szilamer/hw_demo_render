import React, { useState, useRef, useEffect, useMemo } from 'react';
import Timeline, { TimelineItem, Document } from './components/Timeline';
import Graph, { GraphNode, GraphEdge } from './components/Graph';
import ChatBox, { ChatBoxHandle } from './components/ChatBox';
import Calendar, { AppointmentEvent } from './components/Calendar';
import HealthMetrics from './components/HealthMetrics';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import AppointmentSummary from './components/AppointmentSummary.tsx';
import { useLocalStorage } from './hooks/useLocalStorage';
import EventForm from './components/EventForm';
import { FaUserMd, FaHeartbeat, FaLink, FaCalculator, FaChartLine, FaProjectDiagram, FaQuestionCircle } from 'react-icons/fa'; // Example icons
import AnamnesisForm from './components/AnamnesisForm';

// Környezeti változók beolvasása
// const CHAT_WEBHOOK_URL = process.env.REACT_APP_CHAT_WEBHOOK_URL || '/webhook/webhook';  // Chat üzenetek kezelése
// const CHAT_WEBHOOK_URL = process.env.REACT_APP_CHAT_WEBHOOK_URL; // Chat üzenetek kezelése
// const CHAT_WEBHOOK_URL = 'http://n8nalfa.hwnet.local:5678/webhook/webhook'; // Local Docker Webhook URL
const CHAT_WEBHOOK_URL = 'http://n8nalfa.hwnet.local:5678/webhook/webhook'; // Local Docker Webhook URL
// const CHAT_WEBHOOK_URL = 'https://n8n-tc2m.onrender.com/webhook/webhook'; // PRODUCTION Webhook URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || ''; // Backend API base URL

// Kovács Julianna (RA) adatai - FRISSÍTVE
const patientEvents: TimelineItem[] = [
  { 
    id: 'ev1', 
    content: 'Első Vizsgálat és Diagnózis', 
    start: new Date('2014-09-24'),
    documents: [{ id: 'doc_ev1_1', title: 'Kórlap 2014-09-24', url: 'test.pdf', type: 'pdf' }]
  },
  { 
    id: 'ev2', 
    content: 'Kontroll Vizsgálat (Javulás)', 
    start: new Date('2015-03-24'),
    documents: [{ id: 'doc_ev2_1', title: 'Kórlap 2015-03-24', url: 'kj_korlap_2015_03_24.pdf', type: 'pdf' }]
  },
  { 
    id: 'ev3', 
    content: 'Kontroll Vizsgálat (Remisszió közeli)', 
    start: new Date('2015-09-21'),
    documents: [{ id: 'doc_ev3_1', title: 'Kórlap 2015-09-21', url: 'kj_korlap_2015_09_21.pdf', type: 'pdf' }]
  },
  { 
    id: 'ev4', 
    content: 'Fellángolás', 
    start: new Date('2016-04-07'),
    documents: [{ id: 'doc_ev4_1', title: 'Kórlap 2016-04-07', url: 'kj_korlap_2016_04_07.pdf', type: 'pdf' }]
  },
  { 
    id: 'ev5', 
    content: 'Első Biológiai Terápia Indítása (Adalimumab)', 
    start: new Date('2016-07-09'),
    documents: [{ id: 'doc_ev5_1', title: 'Kórlap 2016-07-09', url: 'kj_korlap_2016_07_09.pdf', type: 'pdf' }]
  },
  { 
    id: 'ev6', 
    content: 'Kontroll Vizsgálat (Remisszió)', 
    start: new Date('2017-03-06'),
    documents: [{ id: 'doc_ev6_1', title: 'Kórlap 2017-03-06', url: 'kj_korlap_2017_03_06.pdf', type: 'pdf' }]
  },
  { 
    id: 'ev7', 
    content: 'Fellángolás', 
    start: new Date('2018-04-19'),
    documents: [{ id: 'doc_ev7_1', title: 'Kórlap 2018-04-19', url: 'kj_korlap_2018_04_19.pdf', type: 'pdf' }]
  },
  { 
    id: 'ev8', 
    content: 'Kontroll Vizsgálat (Stabilizálódás)', 
    start: new Date('2018-10-25'),
    documents: [{ id: 'doc_ev8_1', title: 'Kórlap 2018-10-25', url: 'kj_korlap_2018_10_25.pdf', type: 'pdf' }]
  },
  { 
    id: 'ev9', 
    content: 'Fellángolás / Második Biológiai Terápia', 
    start: new Date('2019-04-16'),
    documents: [{ id: 'doc_ev9_1', title: 'Kórlap 2019-04-16', url: 'kj_korlap_2019_04_16.pdf', type: 'pdf' }]
  },
  { 
    id: 'ev10', 
    content: 'Kontroll Vizsgálat (Enyhe javulás)', 
    start: new Date('2019-10-17'),
    documents: [{ id: 'doc_ev10_1', title: 'Kórlap 2019-10-17', url: 'kj_korlap_2019_10_17.pdf', type: 'pdf' }]
  },
  { 
    id: 'ev11', 
    content: 'Kontroll Vizsgálat / Progresszió', 
    start: new Date('2020-04-23'),
    documents: [{ id: 'doc_ev11_1', title: 'Kórlap 2020-04-23', url: 'kj_korlap_2020_04_23.pdf', type: 'pdf' }]
  },
  // Labor leletek hozzáadása az idővonalhoz
  { 
    id: 'lab_2014_09_23', 
    content: 'Laborvizsgálat', 
    start: new Date('2014-09-23'),
    documents: [{ id: 'doc_lab_2014_09_23', title: 'Laborlelet 2014-09-23', url: 'lab_20140923_cb.pdf', type: 'pdf' }]
  },
  { 
    id: 'lab_2015_03_24', 
    content: 'Laborvizsgálat', 
    start: new Date('2015-03-24'),
    documents: [{ id: 'doc_lab_2015_03_24', title: 'Laborlelet 2015-03-24', url: 'lab_20150324_cb.pdf', type: 'pdf' }]
  },
  { 
    id: 'lab_2015_09_21', 
    content: 'Laborvizsgálat', 
    start: new Date('2015-09-21'),
    documents: [{ id: 'doc_lab_2015_09_21', title: 'Laborlelet 2015-09-21', url: 'lab_20150921_cb.pdf', type: 'pdf' }]
  },
  { 
    id: 'lab_2016_04_07', 
    content: 'Laborvizsgálat', 
    start: new Date('2016-04-07'),
    documents: [{ id: 'doc_lab_2016_04_07', title: 'Laborlelet 2016-04-07', url: 'lab_20160407_cb.pdf', type: 'pdf' }]
  },
  { 
    id: 'lab_2016_07_08', 
    content: 'Laborvizsgálat', 
    start: new Date('2016-07-08'),
    documents: [{ id: 'doc_lab_2016_07_08', title: 'Laborlelet 2016-07-08', url: 'lab_20160708_cb.pdf', type: 'pdf' }]
  },
  { 
    id: 'lab_2017_03_06', 
    content: 'Laborvizsgálat', 
    start: new Date('2017-03-06'),
    documents: [{ id: 'doc_lab_2017_03_06', title: 'Laborlelet 2017-03-06', url: 'lab_20170306_cb.pdf', type: 'pdf' }]
  },
  { 
    id: 'lab_2017_09_13', 
    content: 'Laborvizsgálat', 
    start: new Date('2017-09-13'),
    documents: [{ id: 'doc_lab_2017_09_13', title: 'Laborlelet 2017-09-13', url: 'lab_20170913_cb.pdf', type: 'pdf' }]
  },
  { 
    id: 'lab_2018_04_19', 
    content: 'Laborvizsgálat', 
    start: new Date('2018-04-19'),
    documents: [{ id: 'doc_lab_2018_04_19', title: 'Laborlelet 2018-04-19', url: 'lab_20180419_cb.pdf', type: 'pdf' }]
  },
  { 
    id: 'lab_2018_10_25', 
    content: 'Laborvizsgálat', 
    start: new Date('2018-10-25'),
    documents: [{ id: 'doc_lab_2018_10_25', title: 'Laborlelet 2018-10-25', url: 'lab_20181025_cb.pdf', type: 'pdf' }]
  },
  { 
    id: 'lab_2019_04_16', 
    content: 'Laborvizsgálat', 
    start: new Date('2019-04-16'),
    documents: [{ id: 'doc_lab_2019_04_16', title: 'Laborlelet 2019-04-16', url: 'lab_20190416_cb.pdf', type: 'pdf' }]
  },
  { 
    id: 'lab_2020_04_23', 
    content: 'Laborvizsgálat', 
    start: new Date('2020-04-23'),
    documents: [{ id: 'doc_lab_2020_04_23', title: 'Laborlelet 2020-04-23', url: 'lab_20200423_cb.pdf', type: 'pdf' }]
  },
  { 
    id: 'lab_2020_10_08', 
    content: 'Laborvizsgálat', 
    start: new Date('2020-10-08'),
    documents: [{ id: 'doc_lab_2020_10_08', title: 'Laborlelet 2020-10-08', url: 'lab_20201008_cb.pdf', type: 'pdf' }]
  }
];

// Kovács Julianna (RA) gráf csomópontjai - FRISSÍTVE
const patientNodes: GraphNode[] = [
  // Betegség
  { id: 'ra', label: 'Rheumatoid Arthritis (M0580)', type: 'disease' },

  // Vizsgálatok / Események
  { id: 'diag1', label: 'Diagnózis Felállítása', type: 'event', timestamp: new Date('2014-09-24') },
  { id: 'ctrl1', label: 'Kontroll (Javulás, DAS 3.2)', type: 'event', timestamp: new Date('2015-03-24') },
  { id: 'ctrl2', label: 'Kontroll (Remisszió közeli, DAS 2.6)', type: 'event', timestamp: new Date('2015-09-21') },
  { id: 'flare1', label: 'Fellángolás (DAS 5.4)', type: 'event', timestamp: new Date('2016-04-07') },
  { id: 'bio1_start', label: 'Adalimumab Indítása', type: 'event', timestamp: new Date('2016-07-09') },
  { id: 'ctrl3', label: 'Kontroll (Remisszió, DAS 2.8)', type: 'event', timestamp: new Date('2017-03-06') },
  { id: 'flare2', label: 'Fellángolás (DAS 6.2)', type: 'event', timestamp: new Date('2018-04-19') },
  { id: 'ctrl4', label: 'Kontroll (Stabilizálódás, DAS 4.8)', type: 'event', timestamp: new Date('2018-10-25') },
  { id: 'bio2_start', label: 'Második Biológiai Terápia Indítása', type: 'event', timestamp: new Date('2019-04-16') },
  { id: 'ctrl5', label: 'Kontroll (Enyhe javulás, DAS 4.3)', type: 'event', timestamp: new Date('2019-10-17') },
  { id: 'progression', label: 'Progresszió (DAS 6.0)', type: 'event', timestamp: new Date('2020-04-23') },

  // Gyógyszerek (mint események/állapotok)
  { id: 'tx_nsaid', label: 'NSAID (Apranax)', type: 'event', timestamp: new Date('2014-09-24') },
  { id: 'tx_mtx', label: 'Methotrexát + Folsav', type: 'event', timestamp: new Date('2014-09-24') },
  { id: 'tx_pred1', label: 'Prednisolon (átmeneti)', type: 'event', timestamp: new Date('2016-04-07') },
  { id: 'tx_bio1', label: 'Adalimumab', type: 'event', timestamp: new Date('2016-07-09') },
  { id: 'tx_pred2', label: 'Prednisolon (átmeneti, emelt)', type: 'event', timestamp: new Date('2018-04-19') },
  { id: 'tx_bio2', label: 'Második Biológiai Terápia', type: 'event', timestamp: new Date('2019-04-16') },

  // Laborleletek
  { id: 'lab_node_2014_09_23', label: 'Laborvizsgálat', type: 'lab', timestamp: new Date('2014-09-23') },
  { id: 'lab_node_2015_03_24', label: 'Laborvizsgálat', type: 'lab', timestamp: new Date('2015-03-24') },
  { id: 'lab_node_2015_09_21', label: 'Laborvizsgálat', type: 'lab', timestamp: new Date('2015-09-21') },
  { id: 'lab_node_2016_04_07', label: 'Laborvizsgálat', type: 'lab', timestamp: new Date('2016-04-07') },
  { id: 'lab_node_2016_07_08', label: 'Laborvizsgálat', type: 'lab', timestamp: new Date('2016-07-08') },
  { id: 'lab_node_2017_03_06', label: 'Laborvizsgálat', type: 'lab', timestamp: new Date('2017-03-06') },
  { id: 'lab_node_2017_09_13', label: 'Laborvizsgálat', type: 'lab', timestamp: new Date('2017-09-13') },
  { id: 'lab_node_2018_04_19', label: 'Laborvizsgálat', type: 'lab', timestamp: new Date('2018-04-19') },
  { id: 'lab_node_2018_10_25', label: 'Laborvizsgálat', type: 'lab', timestamp: new Date('2018-10-25') },
  { id: 'lab_node_2019_04_16', label: 'Laborvizsgálat', type: 'lab', timestamp: new Date('2019-04-16') },
  { id: 'lab_node_2020_04_23', label: 'Laborvizsgálat', type: 'lab', timestamp: new Date('2020-04-23') },
  { id: 'lab_node_2020_10_08', label: 'Laborvizsgálat', type: 'lab', timestamp: new Date('2020-10-08') },

  // Kiemelt labor értékek (fontos indikátorok RA esetén)
  { id: 'lab_crp_2014_09_23', label: 'CRP: 38 mg/L', type: 'labValue', timestamp: new Date('2014-09-23') },
  { id: 'lab_we_2014_09_23', label: 'Süllyedés: 27 mm/h', type: 'labValue', timestamp: new Date('2014-09-23') },
  
  { id: 'lab_crp_2015_03_24', label: 'CRP: 9 mg/L', type: 'labValue', timestamp: new Date('2015-03-24') },
  { id: 'lab_we_2015_03_24', label: 'Süllyedés: 22 mm/h', type: 'labValue', timestamp: new Date('2015-03-24') },
  
  { id: 'lab_crp_2015_09_21', label: 'CRP: 4 mg/L', type: 'labValue', timestamp: new Date('2015-09-21') },
  { id: 'lab_we_2015_09_21', label: 'Süllyedés: 14 mm/h', type: 'labValue', timestamp: new Date('2015-09-21') },
  
  { id: 'lab_crp_2016_04_07', label: 'CRP: 35 mg/L', type: 'labValue', timestamp: new Date('2016-04-07') },
  { id: 'lab_we_2016_04_07', label: 'Süllyedés: 42 mm/h', type: 'labValue', timestamp: new Date('2016-04-07') },
  
  { id: 'lab_crp_2016_07_08', label: 'CRP: 31 mg/L', type: 'labValue', timestamp: new Date('2016-07-08') },
  { id: 'lab_we_2016_07_08', label: 'Süllyedés: 39 mm/h', type: 'labValue', timestamp: new Date('2016-07-08') },
  
  { id: 'lab_crp_2017_03_06', label: 'CRP: 3 mg/L', type: 'labValue', timestamp: new Date('2017-03-06') },
  { id: 'lab_we_2017_03_06', label: 'Süllyedés: 12 mm/h', type: 'labValue', timestamp: new Date('2017-03-06') },
  
  { id: 'lab_crp_2017_09_13', label: 'CRP: 3 mg/L', type: 'labValue', timestamp: new Date('2017-09-13') },
  { id: 'lab_we_2017_09_13', label: 'Süllyedés: 12 mm/h', type: 'labValue', timestamp: new Date('2017-09-13') },
  
  { id: 'lab_crp_2018_04_19', label: 'CRP: 58 mg/L', type: 'labValue', timestamp: new Date('2018-04-19') },
  { id: 'lab_we_2018_04_19', label: 'Süllyedés: 65 mm/h', type: 'labValue', timestamp: new Date('2018-04-19') },
  
  { id: 'lab_crp_2018_10_25', label: 'CRP: 33 mg/L', type: 'labValue', timestamp: new Date('2018-10-25') },
  { id: 'lab_we_2018_10_25', label: 'Süllyedés: 41 mm/h', type: 'labValue', timestamp: new Date('2018-10-25') },
  
  { id: 'lab_crp_2019_04_16', label: 'CRP: 48 mg/L', type: 'labValue', timestamp: new Date('2019-04-16') },
  { id: 'lab_we_2019_04_16', label: 'Süllyedés: 59 mm/h', type: 'labValue', timestamp: new Date('2019-04-16') },
  
  { id: 'lab_crp_2020_04_23', label: 'CRP: 51 mg/L', type: 'labValue', timestamp: new Date('2020-04-23') },
  { id: 'lab_we_2020_04_23', label: 'Süllyedés: 69 mm/h', type: 'labValue', timestamp: new Date('2020-04-23') },
  
  { id: 'lab_crp_2020_10_08', label: 'CRP: 57 mg/L', type: 'labValue', timestamp: new Date('2020-10-08') },
  { id: 'lab_we_2020_10_08', label: 'Süllyedés: 63 mm/h', type: 'labValue', timestamp: new Date('2020-10-08') }
];

// Kovács Julianna (RA) gráf kapcsolatai - FRISSÍTVE
const patientEdges: GraphEdge[] = [
  // Alap betegség és első diagnózis/kezelés
  { from: 'diag1', to: 'ra' },
  { from: 'ra', to: 'tx_nsaid' },
  { from: 'ra', to: 'tx_mtx' },

  // Kontrollok és állapotváltozások
  { from: 'diag1', to: 'ctrl1' },
  { from: 'ctrl1', to: 'ctrl2' },
  { from: 'ctrl2', to: 'flare1', label: 'rosszabbodás' },

  // Első fellángolás és terápiaváltás
  { from: 'flare1', to: 'tx_pred1' },
  { from: 'flare1', to: 'bio1_start', label: 'terápiaváltás' },
  { from: 'bio1_start', to: 'tx_bio1' }, // Adalimumab maga a terápia
  { from: 'tx_nsaid', to: 'bio1_start', label: 'leállítva?' }, // Feltételezés
  { from: 'tx_mtx', to: 'bio1_start', label: 'folytatva' },

  // Remisszió és újabb fellángolás
  { from: 'bio1_start', to: 'ctrl3', label: 'javulás' },
  { from: 'ctrl3', to: 'flare2', label: 'rosszabbodás' },
  { from: 'flare2', to: 'tx_pred2' }, // Átmeneti szteroid
  { from: 'flare2', to: 'ctrl4', label: 'stabilizálódás' },

  // Második biológiai terápia
  { from: 'ctrl4', to: 'bio2_start', label: 'terápiaváltás' },
  { from: 'bio2_start', to: 'tx_bio2' }, // Második bio terápia
  { from: 'tx_bio1', to: 'bio2_start', label: 'leállítva' }, // Adalimumab leállítva
  { from: 'tx_mtx', to: 'bio2_start', label: 'folytatva' },

  // Utolsó kontrollok és progresszió
  { from: 'bio2_start', to: 'ctrl5', label: 'javulás' },
  { from: 'ctrl5', to: 'progression', label: 'rosszabbodás' },
  
  // Labor leletek és vizsgálatok közötti kapcsolatok
  { from: 'lab_node_2014_09_23', to: 'diag1', label: 'előkészítő vizsgálat' },
  { from: 'lab_node_2015_03_24', to: 'ctrl1', label: 'kapcsolódó' },
  { from: 'lab_node_2015_09_21', to: 'ctrl2', label: 'kapcsolódó' },
  { from: 'lab_node_2016_04_07', to: 'flare1', label: 'kapcsolódó' },
  { from: 'lab_node_2016_07_08', to: 'bio1_start', label: 'előkészítő vizsgálat' },
  { from: 'lab_node_2017_03_06', to: 'ctrl3', label: 'kapcsolódó' },
  { from: 'lab_node_2018_04_19', to: 'flare2', label: 'kapcsolódó' },
  { from: 'lab_node_2018_10_25', to: 'ctrl4', label: 'kapcsolódó' },
  { from: 'lab_node_2019_04_16', to: 'bio2_start', label: 'kapcsolódó' },
  { from: 'lab_node_2020_04_23', to: 'progression', label: 'kapcsolódó' },
  
  // Laborleletek értékei
  { from: 'lab_node_2014_09_23', to: 'lab_crp_2014_09_23' },
  { from: 'lab_node_2014_09_23', to: 'lab_we_2014_09_23' },
  
  { from: 'lab_node_2015_03_24', to: 'lab_crp_2015_03_24' },
  { from: 'lab_node_2015_03_24', to: 'lab_we_2015_03_24' },
  
  { from: 'lab_node_2015_09_21', to: 'lab_crp_2015_09_21' },
  { from: 'lab_node_2015_09_21', to: 'lab_we_2015_09_21' },
  
  { from: 'lab_node_2016_04_07', to: 'lab_crp_2016_04_07' },
  { from: 'lab_node_2016_04_07', to: 'lab_we_2016_04_07' },
  
  { from: 'lab_node_2016_07_08', to: 'lab_crp_2016_07_08' },
  { from: 'lab_node_2016_07_08', to: 'lab_we_2016_07_08' },
  
  { from: 'lab_node_2017_03_06', to: 'lab_crp_2017_03_06' },
  { from: 'lab_node_2017_03_06', to: 'lab_we_2017_03_06' },
  
  { from: 'lab_node_2017_09_13', to: 'lab_crp_2017_09_13' },
  { from: 'lab_node_2017_09_13', to: 'lab_we_2017_09_13' },
  
  { from: 'lab_node_2018_04_19', to: 'lab_crp_2018_04_19' },
  { from: 'lab_node_2018_04_19', to: 'lab_we_2018_04_19' },
  
  { from: 'lab_node_2018_10_25', to: 'lab_crp_2018_10_25' },
  { from: 'lab_node_2018_10_25', to: 'lab_we_2018_10_25' },
  
  { from: 'lab_node_2019_04_16', to: 'lab_crp_2019_04_16' },
  { from: 'lab_node_2019_04_16', to: 'lab_we_2019_04_16' },
  
  { from: 'lab_node_2020_04_23', to: 'lab_crp_2020_04_23' },
  { from: 'lab_node_2020_04_23', to: 'lab_we_2020_04_23' },
  
  { from: 'lab_node_2020_10_08', to: 'lab_crp_2020_10_08' },
  { from: 'lab_node_2020_10_08', to: 'lab_we_2020_10_08' },
  
  // CRP és rheumatoid arthritis kapcsolata
  { from: 'ra', to: 'lab_crp_2014_09_23', label: 'indikátor' },
  { from: 'ra', to: 'lab_we_2014_09_23', label: 'indikátor' }
];

// Idővonal -> Gráf ID map (frissítve Kovács Juliannához)
const eventToNodeMap: Record<string, string> = {
  'ev1': 'diag1',
  'ev2': 'ctrl1',
  'ev3': 'ctrl2',
  'ev4': 'flare1',
  'ev5': 'bio1_start',
  'ev6': 'ctrl3',
  'ev7': 'flare2',
  'ev8': 'ctrl4',
  'ev9': 'bio2_start',
  'ev10': 'ctrl5',
  'ev11': 'progression',
  // Labor leletekhez tartozó események megfeleltetése
  'lab_2014_09_23': 'lab_node_2014_09_23',
  'lab_2015_03_24': 'lab_node_2015_03_24',
  'lab_2015_09_21': 'lab_node_2015_09_21',
  'lab_2016_04_07': 'lab_node_2016_04_07',
  'lab_2016_07_08': 'lab_node_2016_07_08',
  'lab_2017_03_06': 'lab_node_2017_03_06',
  'lab_2017_09_13': 'lab_node_2017_09_13',
  'lab_2018_04_19': 'lab_node_2018_04_19',
  'lab_2018_10_25': 'lab_node_2018_10_25',
  'lab_2019_04_16': 'lab_node_2019_04_16',
  'lab_2020_04_23': 'lab_node_2020_04_23',
  'lab_2020_10_08': 'lab_node_2020_10_08'
};

// Gráf -> Idővonal ID map (automatikus)
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

// Szintetikus metrika-idősorok generálása - FRISSÍTVE (RA + Fiktív adatok)
const metricTimeSeries = {
  'DAS28': [
    { date: '2014-09-24', value: 5.8 },
    { date: '2015-03-24', value: 3.2 },
    { date: '2015-09-21', value: 2.6 },
    { date: '2016-04-07', value: 5.4 },
    { date: '2016-07-09', value: 5.6 },
    { date: '2017-03-06', value: 2.8 },
    { date: '2018-04-19', value: 6.2 },
    { date: '2018-10-25', value: 4.8 },
    { date: '2019-04-16', value: 5.5 },
    { date: '2019-10-17', value: 4.3 },
    { date: '2020-04-23', value: 6.0 }
  ],
  'CRP': [
    { date: '2014-09-24', value: 38 },
    { date: '2015-03-24', value: 9 },
    { date: '2015-09-21', value: 4 },
    { date: '2016-04-07', value: 35 },
    { date: '2016-07-09', value: 31 },
    { date: '2017-03-06', value: 3 },
    { date: '2018-04-19', value: 58 },
    { date: '2018-10-25', value: 33 },
    { date: '2019-04-16', value: 48 },
    { date: '2019-10-17', value: 37 },
    { date: '2020-04-23', value: 51 }
  ],
  'Süllyedés (We)': [
    { date: '2015-03-24', value: 22 }, // 2014 nincs adat
    { date: '2015-09-21', value: 14 },
    { date: '2016-04-07', value: 42 },
    { date: '2016-07-09', value: 39 },
    { date: '2017-03-06', value: 12 },
    { date: '2018-04-19', value: 65 },
    { date: '2018-10-25', value: 41 },
    { date: '2019-04-16', value: 59 },
    { date: '2019-10-17', value: 41 },
    { date: '2020-04-23', value: 69 }
  ],
  'Vérnyomás': [
    { date: '2019-01-15', systolic: 135, diastolic: 88 }, // Fiktív korábbi
    { date: '2019-07-20', systolic: 132, diastolic: 86 }, // Fiktív
    { date: '2020-04-23', systolic: 130, diastolic: 85 }  // Fiktív utolsó
  ],
  'Napi lépésszám': [
    { date: '2019-01-15', value: 2500 }, // Fiktív - CSÖKKENTVE
    { date: '2019-07-20', value: 2800 }, // Fiktív - CSÖKKENTVE
    { date: '2020-04-23', value: 3000 }  // Fiktív - CSÖKKENTVE
  ],
  'Állapot': [
    { date: '2014-09-24', value: 4 }, // Diagnózis (Magas akt.)
    { date: '2015-03-24', value: 3 }, // Javulás (Mérsékelt akt.)
    { date: '2015-09-21', value: 2 }, // Remisszió közeli (Alacsony akt.)
    { date: '2016-04-07', value: 4 }, // Fellángolás (Magas akt.)
    { date: '2016-07-09', value: 4 }, // Biológiai terápia indítása (Magas akt.)
    { date: '2017-03-06', value: 1 }, // Remisszió
    { date: '2018-04-19', value: 4 }, // Fellángolás (Magas akt.)
    { date: '2018-10-25', value: 3 }, // Stabilizálódás (Magas akt. de javult)
    { date: '2019-04-16', value: 4 }, // Fellángolás / Terápiaváltás (Magas akt.)
    { date: '2019-10-17', value: 3 }, // Enyhe javulás (Magas akt. de javult)
    { date: '2020-04-23', value: 4 }  // Progresszió (Magas akt.)
  ]
};

// Metrika leírások - FRISSÍTVE (RA + Fiktív adatok)
const metricDescriptions: Record<string, string> = {
  'DAS28': 'Disease Activity Score 28: Összetett mutató a Rheumatoid Arthritis aktivitásának mérésére. Magas érték magas aktivitást jelez.',
  'CRP': 'C-reaktív protein: Gyulladásos marker a vérben. Emelkedett szintje aktív gyulladásra utal. Normál: < 5-10 mg/L.',
  'Süllyedés (We)': 'Vörösvértest süllyedés: Szintén gyulladásos marker. Magasabb érték gyulladást jelez. Normál: < 20-30 mm/h.',
  'Állapot': 'A betegség aktivitásának/progressziójának szubjektív/kvantifikált mérőszáma (1:Remisszió, 4:Magas akt./Progresszió).',
  'Vérnyomás': 'A vérnyomás a keringési rendszer állapotát mutatja. A normál érték 120/80 mmHg körül van.',
  'Napi lépésszám': 'A napi lépésszám a fizikai aktivitás mérőszáma. RA esetén az aktivitás korlátozott lehet.'
};

const statusDescriptions = [
  { label: 'Normál/Remisszió', color: '#4CAF50', desc: 'Az érték/állapot megfelelő vagy a betegség inaktív.' },
  { label: 'Enyhe/Mérsékelt Aktivitás/Figyelmeztető', color: '#FFC107', desc: 'Az érték/állapot eltér a normálistól, figyelmet igényel.' },
  { label: 'Magas Aktivitás/Progresszió/Kritikus', color: '#F44336', desc: 'Jelentős eltérés vagy betegségaktivitás.' }
];

// A metrikák típusai - FRISSÍTVE (RA + Fiktív adatok)
const metricKeys = ['DAS28', 'CRP', 'Süllyedés (We)', 'Vérnyomás', 'Napi lépésszám'] as const;
type MetricKey = typeof metricKeys[number];

// Define possible views for the main panel
type MainPanelView = 'graph' | 'metric' | 'connections' | 'financing';

// Define the special event data
const specialEventData: TimelineItem = {
  id: 'special_upload_event_2020_04_28',
  content: 'Feltöltött Dokumentumok (Labor+Kórlap)',
  start: new Date('2020-04-28'), // Specific date
  documents: [
    // Use existing document URLs instead of assumed ones
    { id: 'doc_special_korlap', title: 'Kórlap 2020-04-23 (Referencia)', url: 'kj_korlap_2020_04_23.pdf', type: 'pdf' }, 
    { id: 'doc_special_labor', title: 'Laborlelet 2020-04-23 (Referencia)', url: 'lab_20200423_cb.pdf', type: 'pdf' } 
  ],
  className: 'special-upload-event' // Class for special styling
};

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
  const [editingEvent, setEditingEvent] = useState<TimelineItem | null>(null);
  // State to control the main panel view
  const [mainPanelView, setMainPanelView] = useState<MainPanelView>('graph'); 
  const [showSpecialEvent, setShowSpecialEvent] = useState<boolean>(false); // State for special event visibility

  // Példa userId, reason, patientHistory (ezeket érdemes később dinamikusan kezelni)
  const userId = 'kovacs_istvan';
  const reason = 'Rendszeres kontroll vizsgálat';
  const patientHistory = {};

  // Memoized list of events to display, including the special one if flag is set
  const displayedEvents = useMemo(() => {
    const allEvents = [...events];
    if (showSpecialEvent) {
      // Add or replace the special event
      const existingIndex = allEvents.findIndex(e => e.id === specialEventData.id);
      if (existingIndex > -1) {
        allEvents[existingIndex] = specialEventData; // Replace if ID exists (though unlikely)
      } else {
        allEvents.push(specialEventData);
      }
    }
    // Sort events by date before passing to Timeline
    return allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events, showSpecialEvent]);

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
    if (itemId) {
        setMainPanelView('graph'); // Switch back to graph view when an event is selected
        setSelectedMetric(null); // Hide metric chart overlay
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
    setSelectedMetric(null);
    await new Promise(resolve => setTimeout(resolve, 100));
    setShowCalendar(true);
    setSuggestedSlots(slots);
    console.log('Calendar state updated:', { showCalendar: true, slots: slots, selectedMetric: null });
    return true;
  };

  const handleSlotSelect = async (slot: AppointmentEvent) => {
    try {
      setCurrentSlot(slot);
      
      // Bővített üzenet a felhasználónak
      chatboxRef.current?.addMessage(
        `Időpont kiválasztva: ${format(new Date(slot.start), 'yyyy-MM-dd HH:mm')}\nElőkészítem az anamnézis összefoglalót...`,
        'user'
      );

      // Beégetett anamnézis összefoglaló
      const hardcodedSummary = `
BETEG ÁLLAPOTÁNAK ÖSSZEFOGLALÁSA
================================

Kovács Julianna (62 éves nő)
Diagnózis: Rheumatoid Arthritis (2014-től)

AKTUÁLIS ÁLLAPOT
---------------
- DAS28 érték: 6.0 (Magas betegségaktivitás)
  A betegség aktivitása jelentősen emelkedett, ami az ízületi gyulladások fokozódására és a terápia hatékonyságának csökkenésére utal.

- CRP: 51 mg/L (Jelentősen emelkedett)
  A gyulladásos marker szintje több mint tízszerese a normál értéknek (< 5 mg/L), ami aktív gyulladásos folyamatot jelez.

- Süllyedés: 69 mm/h (Jelentősen emelkedett)
  A magas süllyedés érték korrelál a CRP emelkedéssel, megerősítve a szisztémás gyulladás jelenlétét.

- Vérnyomás: 130/85 mmHg (Normál tartomány)
  A kardiovaszkuláris paraméterek stabilak, a vérnyomás megfelelően kontrollált.

- Napi lépésszám: 3000 lépés (Csökkent aktivitás)
  A fizikai aktivitás jelentősen elmarad az ajánlott napi 6000-8000 lépéstől, ami összefügghet az ízületi fájdalmakkal.

BETEGSÉGTÖRTÉNET ÖSSZEFOGLALÁSA
-----------------------------
- 2014: Első diagnózis és kezelés kezdete
  Kezdeti DAS28: 5.8, magas betegségaktivitással induló kórkép. NSAID és Methotrexát terápia indítása.

- 2015: Kezdeti terápiás válasz
  Átmeneti javulás (DAS28: 3.2), majd remisszió közeli állapot (DAS28: 2.6) elérése.

- 2016: Első biológiai terápia (Adalimumab)
  Fellángolás miatt (DAS28: 5.4) biológiai terápia indítása, ami kezdetben hatékonynak bizonyult.

- 2017: Remisszió elérése
  A biológiai terápia mellett jelentős javulás, remisszió (DAS28: 2.8) dokumentálása.

- 2018-2019: Terápiás hatékonyság csökkenése
  Ismételt fellángolások (DAS28: 6.2), második biológiai terápia bevezetése szükségessé vált.

- 2020: Progresszió
  A betegség aktivitása ismét fokozódott (DAS28: 6.0), terápiás stratégia újragondolása szükséges.

JELENLEGI KEZELÉS
---------------
- Második vonalbeli biológiai terápia
  2019 áprilisa óta, jelenleg csökkent hatékonysággal

- Methotrexát + Folsav
  Folyamatos alapkezelésként a diagnózis óta

- Rendszeres kontrollvizsgálatok
  3 havonta esedékes laborkontroll és fizikális vizsgálat

KOCKÁZATI TÉNYEZŐK
----------------
- Tartósan magas betegségaktivitás
  A gyulladásos markerek folyamatos emelkedése strukturális károsodások kockázatát növeli

- Csökkent terápiás válasz
  A második biológiai terápia mellett sem megfelelő a betegségkontroll

- Mozgásszervi funkciók beszűkülése
  A csökkent fizikai aktivitás további funkcióvesztés kockázatát hordozza

JAVASLATOK
---------
1. Részletes fizikális vizsgálat
   Különös tekintettel az érintett ízületekre és funkcionális státuszra

2. Aktuális gyulladásos paraméterek ellenőrzése
   CRP, We, teljes vérkép, májfunkció, vesefunkció kontroll

3. Terápiás hatékonyság újraértékelése
   A biológiai terápia esetleges váltásának mérlegelése

4. Életmódbeli tanácsadás
   Gyógytorna, megfelelő fizikai aktivitás tervezése a terhelhetőség függvényében

A beteg állapota az utóbbi időszakban romlott, a jelenlegi terápiás stratégia felülvizsgálata és módosítása válhat szükségessé. A magas gyulladásos aktivitás és a funkcionális státusz romlása miatt sürgős beavatkozás indokolt.`;

      setAppointmentSummary(hardcodedSummary);
      setShowCalendar(false);
      setShowSummary(true);

      // Ha van webhook URL, akkor még mindig megpróbáljuk elküldeni az adatokat
      if (CHAT_WEBHOOK_URL) {
        try {
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
                selectedMetric: selectedMetric ? healthMetrics.find(m => m.title === selectedMetric) : null,
                selectedEvent: selectedEvent ? events.find(e => e.id === selectedEvent) : null,
                selectedNode: selectedNode ? patientNodes.find(n => n.id === selectedNode) : null,
                visibleNodes: visibleNodes,
                visibleEdges: visibleEdges
              }
            })
          });

          const data = await response.json();
          if (data.response) {
            chatboxRef.current?.addMessage(data.response, 'assistant');
          }
        } catch (error) {
          console.log('N8n webhook hívás sikertelen, de az anamnézis űrlap megjelenik:', error);
        }
      }

    } catch (error) {
      console.error('Error in handleSlotSelect:', error);
      chatboxRef.current?.addMessage(
        'Hiba történt az időpont kiválasztásának feldolgozása során.',
        'assistant'
      );
    }
  };

  const handleSendMessage = async (message: string, callback: (response: string) => void) => {
    if (!CHAT_WEBHOOK_URL) {
      console.error('CHAT_WEBHOOK_URL is not defined. Cannot send message.');
      callback("Hiba: A chat funkció nincs konfigurálva (hiányzó Webhook URL).");
      return;
    }

    console.log('Üzenet küldése a webhookra:', CHAT_WEBHOOK_URL);
    try {
      // Context előkészítése (változatlan)
      let currentContext = {};
      if (selectedMetric) {
        // If a metric is selected, send metric context
        const metricData = healthMetrics.find(m => m.title === selectedMetric);
        currentContext = {
          selectedMetric: metricData ? {
            name: metricData.title,
            value: metricData.value,
            unit: metricData.unit,
            status: metricData.status,
            description: metricDescriptions[selectedMetric] // Get description
          } : null,
          selectedEvent: null, // Explicitly null when metric is focus
          selectedNode: null   // Explicitly null when metric is focus
        };
      } else {
        // Otherwise, send event/node context (if selected)
        currentContext = {
          selectedMetric: null,
          selectedEvent: selectedEvent ? events.find(e => e.id === selectedEvent) : null,
          selectedNode: selectedNode ? patientNodes.find(n => n.id === selectedNode) : null
        };
      }

      const requestBody = { 
          message: message,
          timestamp: Date.now(), 
          context: {
            ...currentContext,
            visibleNodes: visibleNodes,
            visibleEdges: visibleEdges
          }
      };

      console.log('Küldés a webhooknak:', JSON.stringify(requestBody, null, 2)); // Részletesebb logolás

      const response = await fetch(CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Webhook hiba: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Webhook válasz:', data);

      // --- ÚJ LOGIKA KEZDETE ---
      // 1. Naptár megnyitása, ha az n8n jelzi
      if (data && data.action === "open_calendar") {
        console.log("'open_calendar' action detektálva, naptár megnyitása...");
        await openAppointmentCalendar(); 
      }

      // 2. Szöveges válasz megjelenítése a chatboxban, ha van
      const reply = data.response || data.message || data.output || null;
      if (reply) {
        callback(reply);
      } else {
        // Ha semmilyen szöveges válasz nincs, akkor is jelezni kellene?
        // callback('Nem érkezett válasz.'); 
        console.log('Nem érkezett megjeleníthető szöveges válasz az n8n-től.');
      }
      // --- ÚJ LOGIKA VÉGE ---

    } catch (error) {
      console.error('Hiba az üzenetküldés során:', error);
      callback(`Hiba történt az üzenetküldés során: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Foglalás véglegesítését kezelő függvény
  const handleConfirmAppointment = async () => {
    try {
      if (!CHAT_WEBHOOK_URL) {
        console.error('Hiba: REACT_APP_N8N_WEBHOOK_URL nincs beállítva.');
        chatboxRef.current?.addMessage(
          'Hiba: Az időpontfoglalás véglegesítése jelenleg nem lehetséges (konfigurációs hiba).',
          'assistant'
        );
        return;
      }

      // Küldés az n8n felé
      chatboxRef.current?.addMessage(
        'Foglalás véglegesítése folyamatban...',
        'assistant'
      );

      const response = await fetch(CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: "Időpontfoglalás véglegesítése",
          action: "confirm_booking", // Ezt az n8n workflow-nak kell tudnia kezelni
          slot: currentSlot, // A kiválasztott időpont adatai
          summary: appointmentSummary, // Az n8n (vagy itt generált) összegzés
          context: { // Aktuális kontextus küldése
            selectedMetric: selectedMetric,
            selectedEvent: selectedEvent ? patientEvents.find(e => e.id === selectedEvent) : null,
            selectedNode: selectedNode ? patientNodes.find(n => n.id === selectedNode) : null,
            // Lehet, hogy a teljes látható gráfot is érdemes lenne küldeni
            visibleNodes: visibleNodes,
            visibleEdges: visibleEdges
          }
        })
      });

      const data = await response.json();

      if (data.status === "success") {
        chatboxRef.current?.addMessage(
          data.response || 'Az időpontfoglalás sikeresen véglegesítve.', // Használjuk az n8n válaszát, ha van
          'assistant'
        );
        setShowSummary(false); // Összegző elrejtése
      } else {
         chatboxRef.current?.addMessage(
          data.response || 'Hiba történt a foglalás véglegesítése során.', // Használjuk az n8n válaszát, ha van
          'assistant'
        );
      }

    } catch (error) {
      console.error('Error during appointment confirmation:', error);
      chatboxRef.current?.addMessage(
        'Hálózati vagy szerverhiba történt az időpontfoglalás véglegesítése során.',
        'assistant'
      );
    }
  };

  // Demo egészségügyi mérőszámok - FRISSÍTVE (RA + Fiktív adatok - utolsó állapot)
  const healthMetrics = useMemo(() => [
    {
      icon: '📈',
      title: 'DAS28',
      value: '6.0',
      unit: '',
      status: 'critical', // Magas aktivitás
      description: 'A DAS28 (Disease Activity Score) a rheumatoid arthritis betegség aktivitását mérő pontszám. A 5.1 feletti érték magas betegség aktivitást jelez.'
    },
    {
      icon: '🔥',
      title: 'CRP',
      value: '51',
      unit: 'mg/L',
      status: 'critical', // Magas gyulladás
      description: 'A C-reaktív protein (CRP) a szervezetben zajló gyulladásos folyamatokat jelző fehérje. A normál érték 5 mg/L alatt van.'
    },
    {
      icon: '⏳',
      title: 'Süllyedés (We)',
      value: '69',
      unit: 'mm/h',
      status: 'critical', // Magas gyulladás
      description: 'A vörösvérsejt süllyedés (We) a vérben zajló gyulladásos folyamatokat jelző érték. A normál tartomány nőknél 0-20 mm/h között van.'
    },
    {
      icon: '🫀',
      title: 'Vérnyomás',
      value: '130/85', // Fiktív utolsó
      unit: 'mmHg',
      status: 'normal', // Fiktív
      description: 'A vérnyomás a szív által pumpált vér által az artériák falára kifejtett nyomás. A normál érték 120/80 mmHg körül van.'
    },
    {
      icon: '👣',
      title: 'Napi lépésszám',
      value: '3000', // Fiktív utolsó - CSÖKKENTVE
      unit: 'lépés',
      status: 'normal', // Fiktív
      description: 'A napi lépésszám a fizikai aktivitás egyik fontos mutatója. Az ajánlott napi minimum lépésszám 6000-8000 lépés.'
    }
  ], []);

  // Az aktuális metrika (ha nincs kiválasztva, az első)
  const currentMetric = selectedMetric || metricKeys[0];
  const currentMetricObj = healthMetrics.find(m => m.title === currentMetric);
  const currentStatus = currentMetricObj?.status || 'normal';
  const currentStatusObj = statusDescriptions.find(s => s.label.toLowerCase() === (currentStatus === 'normal' ? 'normál' : currentStatus === 'warning' ? 'figyelmeztető' : 'kritikus').toLowerCase());

  // Function to open the edit form
  const handleEditEvent = (item: TimelineItem) => {
    console.log("Editing event:", item);
    setEditingEvent(item);
  };

  // Function to handle adding a new event (called by EventForm onSubmit)
  // This function now assumes it's called *after* a successful upload in EventForm
  const handleAddEvent = async (newUserEvent: TimelineItem) => {
    console.log("Handling successful upload event:", newUserEvent);
    
    // Add the event created by the user
    setEvents(prevEvents => {
      // Avoid adding duplicates if the ID already exists (though should be unique)
      if (prevEvents.some(e => e.id === newUserEvent.id)) {
        return prevEvents;
      }
      return [...prevEvents, newUserEvent];
    });

    // Show the special hardcoded event
    setShowSpecialEvent(true);

    // Optionally update graph nodes/edges if needed
    // ...
  };

  // Function to handle updating an existing event (passed directly to EventForm when editing)
  const handleUpdateEvent = async (updatedEvent: TimelineItem) => {
    // --- Placeholder Document Upload/Update --- 
    // Similar to handleAddEvent, handle upload/deletion of documents here.
    // The updatedEvent.documents likely contains a mix of existing and new file info.
    console.log("Updating event (upload placeholder):", updatedEvent);
    // --- End Placeholder --- 

    setEvents(prevEvents =>
      prevEvents.map(event => (event.id === updatedEvent.id ? updatedEvent : event))
    );
    setEditingEvent(null); // Close the edit form
    
    // Decide if editing should also trigger the special event
    // For now, let's assume only adding new triggers it.
    // If editing *should* trigger it, uncomment the next line:
    // setShowSpecialEvent(true);
  };

  const handleMetricSelect = async (metric: MetricKey) => {
    setSelectedMetric(metric);
    setMainPanelView('metric');

    // Get the metric data
    const metricData = healthMetrics.find(m => m.title === metric);
    
    if (!metricData) {
      console.error('Selected metric data not found:', metric);
      return;
    }

    try {
      if (!CHAT_WEBHOOK_URL) {
        console.error('CHAT_WEBHOOK_URL is not defined. Cannot send metric selection.');
        chatboxRef.current?.addMessage(
          "Hiba: A chat funkció nincs konfigurálva (hiányzó Webhook URL).",
          'assistant'
        );
        return;
      }

      // Add a message to indicate that we're analyzing the metric
      chatboxRef.current?.addMessage(
        `A "${metric}" mérőszám elemzése folyamatban...`,
        'user'
      );

      const response = await fetch(CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "metric_selected",
          context: {
            selectedMetric: {
              name: metricData.title,
              value: metricData.value,
              unit: metricData.unit,
              status: metricData.status,
              description: metricDescriptions[metric] || '',
              patient: {
                firstName: "Julianna" // Using the patient's first name as requested
              }
            },
            selectedEvent: selectedEvent ? events.find(e => e.id === selectedEvent) : null,
            selectedNode: selectedNode ? patientNodes.find(n => n.id === selectedNode) : null,
            visibleNodes: visibleNodes,
            visibleEdges: visibleEdges
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Display the response in the chatbox
      if (data.response || data.message || data.output) {
        chatboxRef.current?.addMessage(
          data.response || data.message || data.output,
          'assistant'
        );
      }

    } catch (error) {
      console.error('Error sending metric selection:', error);
      chatboxRef.current?.addMessage(
        'Hiba történt a mérőszám elemzése során. Kérem próbálja újra később.',
        'assistant'
      );
    }
  };

  // Function to handle switching the main panel view
  const showDataConnections = () => {
    setMainPanelView('connections');
    setSelectedMetric(null); // Hide metric chart overlay
  };

  const showFinancingPlanner = () => {
    setMainPanelView('financing');
    setSelectedMetric(null); // Hide metric chart overlay
  };

  const showGraphView = () => {
    setMainPanelView('graph');
    setSelectedMetric(null); // Hide metric chart overlay
    setSelectedEvent(null); // Deselect event if returning to general graph view
    setSelectedNode(null);
  }

  const handleDownloadAnamnesis = () => {
    // Anamnézis letöltése
    const element = document.createElement('a');
    const file = new Blob([appointmentSummary], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `anamnezis_${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="app-container">
      <div className="header-container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 20px',
        borderBottom: '1px solid #e3e6f0'
      }}>
        <h1 style={{ 
          color: '#4e73df', 
          margin: 0,
          fontSize: '1.8rem',
          fontWeight: 600
        }}>
          Intelligens Egészségtámogató Rendszer
        </h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#e3e6f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            👤
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column'
          }}>
            <span style={{
              fontSize: '16px',
              fontWeight: 500,
              color: '#2c3e50'
            }}>
              Júlia
            </span>
          </div>
        </div>
      </div>

      <div className="metrics-container" style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '10px', 
        justifyContent: 'space-between',
        padding: '15px',
        margin: '0 0 20px 0'
      }}>
        {healthMetrics.map((metric, index) => (
          <div 
            key={index} 
            className="metric-box" 
            onClick={() => handleMetricSelect(metric.title as MetricKey)} 
            style={{ 
              cursor: 'pointer',
              flex: '1 1 calc(16.66% - 10px)',
              minWidth: '150px',
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '15px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <div 
              className="info-icon" 
              style={{ 
                position: 'absolute',
                top: '8px',
                right: '8px',
                fontSize: '16px',
                color: '#666',
                cursor: 'help'
              }}
              title={metric.description || `${metric.title} részletes információk`}
            >
              <FaQuestionCircle />
            </div>
            <div className="metric-icon" style={{ fontSize: '24px', marginBottom: '5px' }}>{metric.icon}</div>
            <div className="metric-title" style={{ fontWeight: 'bold', marginBottom: '5px' }}>{metric.title}</div>
            <div className="metric-value" style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '5px' }}>
              {metric.value} {metric.unit}
            </div>
            <div 
              className={`metric-status status-${metric.status}`}
              style={{
                backgroundColor: metric.status === 'normal' ? '#e8f5e9' : 
                                 metric.status === 'warning' ? '#fff8e1' : '#ffebee',
                color: metric.status === 'normal' ? '#388e3c' : 
                       metric.status === 'warning' ? '#f57c00' : '#d32f2f',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              {metric.status === 'normal' ? 'Normál' : 
               metric.status === 'warning' ? 'Figyelmeztető' : 'Kritikus'}
            </div>
          </div>
        ))}
      </div>
      <div className="timeline-container">
        {selectedMetric ? (
          <div className="timeline-chart" style={{ position: 'absolute', zIndex: 1000 }}>
            <button className="button" onClick={showGraphView}>
              Vissza az eseményekhez
            </button>
            <h3>{selectedMetric} időbeli alakulása</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={metricTimeSeries[selectedMetric as keyof typeof metricTimeSeries] || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" domain={['auto', 'auto']} />
                  {selectedMetric === 'Vérnyomás' ? (
                    <>
                      <Line yAxisId="left" type="monotone" dataKey="systolic" stroke="#e53935" name="Szisztolés" dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="diastolic" stroke="#1e88e5" name="Diasztolés" dot={false}/>
                    </>
                  ) : (
                    <Line yAxisId="left" type="monotone" dataKey="value" stroke="#43a047" name={selectedMetric || 'Érték'} dot={false}/>
                  )}
                  <Tooltip formatter={(value: any, name: string) => [`${value}`, name]} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <Timeline
            items={displayedEvents} // Pass the potentially modified list
            onSelect={handleTimelineSelect}
            onRangeChange={handleTimeRangeChange}
            // Pass handleAddEvent to be triggered by EventForm via Timeline
            onAddEvent={handleAddEvent} 
            onEditEvent={handleEditEvent}
          />
        )}
      </div>
      <div className="main-content">
        <div className="graph-container" style={{ position: 'relative' }}>
          {mainPanelView === 'graph' && (
            <>
              <div className="graph-header">
                <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
                  Betegségek és események kapcsolata
                </h2>
                {selectedEvent && (
                  <button 
                    className="button reset-view-button"
                    onClick={showGraphView}
                  >
                    🔄 Összes kapcsolat mutatása
                  </button>
                )}
              </div>
              <div className="graph-inner">
                <Graph
                  nodes={visibleNodes}
                  edges={visibleEdges}
                  onSelect={handleGraphSelect}
                />
              </div>
            </>
          )}

          {mainPanelView === 'metric' && selectedMetric && (
            <div style={{ margin: '0 0 20px 0', background: '#f8f9fa', borderRadius: 8, padding: 20, fontSize: 15, height: '100%', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="metric-icon" style={{ fontSize: '24px' }}>
                    {healthMetrics.find(m => m.title === selectedMetric)?.icon}
                  </div>
                  <h3 style={{ margin: 0 }}>{metricDescriptions[selectedMetric]}</h3>
                </div>
                <button 
                  onClick={showGraphView} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    padding: '8px', 
                    fontSize: '20px',
                    color: '#666',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#eee'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ✕
                </button>
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
          )}

          {mainPanelView === 'connections' && (
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2>Válassza ki az IER adatforrásait</h2>
                <button 
                  onClick={showGraphView}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    padding: '8px', 
                    fontSize: '20px',
                    color: '#666',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#eee'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: 20 }}>
                <div style={{ textAlign: 'center', cursor: 'pointer' }}><FaUserMd size={40} /><p>EESZT</p></div>
                <div style={{ textAlign: 'center', cursor: 'pointer' }}><FaHeartbeat size={40} /><p>Okosóra</p></div>
                <div style={{ textAlign: 'center', cursor: 'pointer' }}><FaChartLine size={40} /><p>Okos Mérleg</p></div>
              </div>
            </div>
          )}

          {mainPanelView === 'financing' && (
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ color: '#4e73df', margin: 0 }}>Betegségfinanszírozás tervező</h2>
                <button 
                  onClick={showGraphView}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    padding: '8px', 
                    fontSize: '20px',
                    color: '#666',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#eee'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ✕
                </button>
              </div>
              <p>A lenti táblázat a 2023-2025 időszakra vonatkozó várható egészségügyi kiadásokat és támogatásokat mutatja.</p>
              
              <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 4px 8px rgba(0,0,0,0.1)', marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                  <div>
                    <h3 style={{ marginBottom: 10 }}>Kovács Julianna RA kezelési terve</h3>
                    <div style={{ fontSize: 14, color: '#666' }}>Utolsó frissítés: 2023. december 10.</div>
                  </div>
                  <button style={{ padding: '8px 16px', background: '#4e73df', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                    PDF Exportálás
                  </button>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        <th style={{ padding: 12, textAlign: 'left' }}>Tétel megnevezése</th>
                        <th style={{ padding: 12, textAlign: 'right' }}>Éves költség (Ft)</th>
                        <th style={{ padding: 12, textAlign: 'right' }}>TB támogatás (%)</th>
                        <th style={{ padding: 12, textAlign: 'right' }}>Önrész (Ft)</th>
                        <th style={{ padding: 12, textAlign: 'center' }}>Státusz</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: 12 }}><strong>Biológiai terápia</strong> (Adalimumab)</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>3,840,000</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>100%</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>0</td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', background: '#e8f5e9', color: '#388e3c', borderRadius: 4, fontSize: 12 }}>Jóváhagyva</span>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #dee2e6', background: '#fafafa' }}>
                        <td style={{ padding: 12 }}><strong>Alap gyógyszerek</strong> (Methotrexate + Folsav)</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>120,000</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>90%</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>12,000</td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', background: '#e8f5e9', color: '#388e3c', borderRadius: 4, fontSize: 12 }}>Jóváhagyva</span>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: 12 }}><strong>Fizioterápia</strong> (évi 10 alkalom)</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>150,000</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>70%</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>45,000</td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', background: '#fff8e1', color: '#f57c00', borderRadius: 4, fontSize: 12 }}>Előjegyzés alatt</span>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #dee2e6', background: '#fafafa' }}>
                        <td style={{ padding: 12 }}><strong>Gyógyászati segédeszközök</strong></td>
                        <td style={{ padding: 12, textAlign: 'right' }}>80,000</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>50%</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>40,000</td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', background: '#ffebee', color: '#d32f2f', borderRadius: 4, fontSize: 12 }}>Igénylés szükséges</span>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: 12 }}><strong>Kontroll vizsgálatok</strong> (negyedévente)</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>120,000</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>100%</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>0</td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', background: '#e8f5e9', color: '#388e3c', borderRadius: 4, fontSize: 12 }}>Jóváhagyva</span>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f1f5fd', borderTop: '2px solid #dee2e6', fontWeight: 'bold' }}>
                        <td style={{ padding: 12 }}>Összesen</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>4,310,000</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>97%</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>97,000</td>
                        <td style={{ padding: 12, textAlign: 'center' }}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ background: '#f1f5fd', padding: 15, borderRadius: 8, width: '48%' }}>
                    <h4 style={{ marginBottom: 10, color: '#4e73df' }}>Finanszírozási tippek</h4>
                    <ul style={{ paddingLeft: 20, marginBottom: 0, fontSize: 14 }}>
                      <li style={{ marginBottom: 8 }}>Éves gyógyszer keretének 90%-a még rendelkezésre áll</li>
                      <li style={{ marginBottom: 8 }}>Gyógyászati segédeszközök támogatása igényelhető</li>
                      <li style={{ marginBottom: 0 }}>Nem TB támogatott kezelések adókedvezménye: 63,500 Ft</li>
                    </ul>
                  </div>
                  
                  <div style={{ background: '#fff8e1', padding: 15, borderRadius: 8, width: '48%' }}>
                    <h4 style={{ marginBottom: 10, color: '#f57c00' }}>Következő lépések</h4>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, fontSize: 14 }}>
                      <input type="checkbox" id="step1" style={{ marginRight: 8 }} />
                      <label htmlFor="step1">Gyógyászati segédeszköz igénylés beadása</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, fontSize: 14 }}>
                      <input type="checkbox" id="step2" style={{ marginRight: 8 }} />
                      <label htmlFor="step2">Fizioterápia előjegyzés megerősítése</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                      <input type="checkbox" id="step3" style={{ marginRight: 8 }} />
                      <label htmlFor="step3">Következő negyedéves felülvizsgálat időpontfoglalása</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Naptár megjelenítése (Overlay struktúrával) */}
          {showCalendar && !showSummary && (
            <div className="overlay-base calendar-container" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              zIndex: 1000,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px'
            }}>
              <div className="overlay-content" style={{
                width: '100%',
                height: '100%',
                maxWidth: '1200px',
                maxHeight: '800px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}>
                <button 
                  onClick={() => {
                    setShowCalendar(false);
                    setMainPanelView('graph');
                  }}
                  style={{ 
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    padding: '8px', 
                    fontSize: '20px',
                    color: '#666',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s',
                    zIndex: 1001
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#eee'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ✕
                </button>
                <Calendar
                  onBack={() => {
                    setShowCalendar(false);
                    setMainPanelView('graph');
                  }}
                  suggestedSlots={suggestedSlots}
                  onSelectSlot={handleSlotSelect}
                />
              </div>
            </div>
          )}

          {/* Időpontfoglalás összegzése (Overlay struktúrával) */}
          {showSummary && currentSlot && (
            <div className="overlay-base appointment-summary" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              zIndex: 1000,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px'
            }}>
              <div className="overlay-content" style={{
                width: '100%',
                height: '100%',
                maxWidth: '1200px',
                maxHeight: '800px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                overflow: 'auto',
                padding: '20px',
                position: 'relative'
              }}>
                <button 
                  onClick={() => {
                    setShowSummary(false);
                    setMainPanelView('graph');
                  }}
                  style={{ 
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    padding: '8px', 
                    fontSize: '20px',
                    color: '#666',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s',
                    zIndex: 1001
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#eee'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ✕
                </button>
                <AnamnesisForm
                  summary={appointmentSummary}
                  onSubmit={handleConfirmAppointment}
                  onDownload={handleDownloadAnamnesis}
                  isSubmitted={false}
                />
              </div>
            </div>
          )}
        </div>
        <div className="chatbox-container">
          <div className="ibr-header">
            <h2>I.E.R. asszisztens</h2>
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
        <button className="button" onClick={showDataConnections}>
          <FaLink style={{ marginRight: 5 }}/> I.E.R. adatkapcsolatok kezelése 
        </button>
        <button className="button" disabled>
          Csatolt szolgáltatások
        </button>
        <button className="button" onClick={showFinancingPlanner}>
          <FaCalculator style={{ marginRight: 5 }}/> Betegségfinanszírozás tervező
        </button>
      </div>

      {editingEvent && (
        <EventForm
          initialData={editingEvent}
          onSubmit={handleUpdateEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
};

export default App;