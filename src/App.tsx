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
import { FaUserMd, FaHeartbeat, FaLink, FaCalculator, FaChartLine, FaProjectDiagram } from 'react-icons/fa'; // Example icons

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
    documents: [{ id: 'doc_ev1_1', title: 'Kórlap 2014-09-24', url: 'kj_korlap_2014_09_24.pdf', type: 'pdf' }]
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
        `Időpont kiválasztva: ${format(new Date(slot.start), 'yyyy-MM-dd HH:mm')}\nKérem várjon, amíg elkészül a vizsgálat előkészítő dokumentum, amit a kezelőorvosa fog megkapni.`,
        'user'
      );

      if (!CHAT_WEBHOOK_URL) {
          console.error('CHAT_WEBHOOK_URL is not defined. Cannot send slot selection.');
          chatboxRef.current?.addMessage(
            "Hiba: A chat funkció nincs konfigurálva (hiányzó Webhook URL).",
            'assistant'
          );
          return;
      }

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
          context: { // A kontextus küldése itt is fontos lehet
            selectedMetric: selectedMetric ? healthMetrics.find(m => m.title === selectedMetric) : null,
            selectedEvent: selectedEvent ? events.find(e => e.id === selectedEvent) : null,
            selectedNode: selectedNode ? patientNodes.find(n => n.id === selectedNode) : null,
            visibleNodes: visibleNodes, // Látható node-ok küldése
            visibleEdges: visibleEdges  // Látható élek küldése
          }
        })
      });

      const data = await response.json();
      
      if (data.response) {
        chatboxRef.current?.addMessage(data.response, 'assistant');
        
        // Ha a webhook válaszában van összegzés, akkor jelenítjük meg
        if (data.summary) {
          setAppointmentSummary(data.summary);
          setShowCalendar(false);
          setShowSummary(true);
        } else {
          // Ha nincs summary, lehet, hogy csak vissza kellene zárni a naptárat?
          // Vagy hagyni nyitva? A küldött kódban itt nem volt explicit kezelés.
          // Most egyelőre nem teszünk semmit, ha nincs summary.
        }
      } else {
        // Ha nincs 'response' a webhook válaszban
        chatboxRef.current?.addMessage('A kiválasztott időpontra vonatkozóan nem érkezett visszajelzés.', 'assistant');
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
      status: 'critical' // Magas aktivitás
    },
    {
      icon: '🔥',
      title: 'CRP',
      value: '51',
      unit: 'mg/L',
      status: 'critical' // Magas gyulladás
    },
    {
      icon: '⏳',
      title: 'Süllyedés (We)',
      value: '69',
      unit: 'mm/h',
      status: 'critical' // Magas gyulladás
    },
    {
      icon: '🫀',
      title: 'Vérnyomás',
      value: '130/85', // Fiktív utolsó
      unit: 'mmHg',
      status: 'normal' // Fiktív
    },
    {
      icon: '👣',
      title: 'Napi lépésszám',
      value: '3000', // Fiktív utolsó - CSÖKKENTVE
      unit: 'lépés',
      status: 'normal' // Fiktív
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

  // Function to handle adding a new event (passed to EventForm via Timeline -> App -> Timeline)
  const handleAddEvent = async (event: TimelineItem) => {
    // --- Placeholder Document Upload --- 
    // In a real app, upload new documents from event.documents here
    // and update event.documents with backend URLs/IDs before saving.
    // Currently, EventForm returns placeholder URLs.
    console.log("Adding event (upload placeholder):", event);
    // --- End Placeholder --- 

    setEvents(prevEvents => [...prevEvents, event]);

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
  };

  const handleMetricSelect = (metric: MetricKey) => {
    setSelectedMetric(metric);
    setMainPanelView('metric'); // Show metric details in the main panel
  }

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

  return (
    <div className="app-container">
      <div className="header-container">
        <h1 style={{ textAlign: 'center', color: '#4e73df', marginBottom: '15px' }}>Intelligens Betegtámogató Rendszer</h1>
        <div className="patient-info">
          <div className="basic-info">
            <strong>Beteg:</strong> Kovács Julianna, 62 éves nő (2020-as adat), 2014-ben diagnosztizált Rheumatoid Arthritis-szal
          </div>
        </div>
      </div>
      <div className="metrics-container" style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '10px', 
        justifyContent: 'space-between',
        padding: '0 15px',
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
              textAlign: 'center'
            }}
          >
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
      <div className="timeline-container" style={{ marginBottom: 60, position: 'relative' }}>
        {selectedMetric && mainPanelView !== 'metric' ? (
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
            <button className="button" style={{ position: 'absolute', right: 10, top: 10 }} onClick={showGraphView}>
              Vissza az eseményekhez
            </button>
            <h3 style={{ marginBottom: 10, textAlign: 'center', fontWeight: 600, fontSize: 20 }}>{selectedMetric} időbeli alakulása</h3>
            <div style={{ width: '100%', paddingRight: 20 }}>
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
            items={events}
            onSelect={handleTimelineSelect}
            onRangeChange={handleTimeRangeChange}
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
                <button onClick={showGraphView} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5 }}>×</button>
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
              <h2>Válassza ki az IBT adatforrásait.</h2>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: 20 }}>
                <div style={{ textAlign: 'center', cursor: 'pointer' }}><FaUserMd size={40} /><p>EESZT</p></div>
                <div style={{ textAlign: 'center', cursor: 'pointer' }}><FaHeartbeat size={40} /><p>Okosóra</p></div>
                <div style={{ textAlign: 'center', cursor: 'pointer' }}><FaChartLine size={40} /><p>Okos Mérleg</p></div>
              </div>
            </div>
          )}

          {mainPanelView === 'financing' && (
            <div style={{ padding: 20 }}>
              <h2 style={{ color: '#4e73df', marginBottom: 20 }}>Betegségfinanszírozás tervező</h2>
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
          
          {/* Naptár megjelenítése (Overlay struktúrával) - az elem a graph-container-en belül */}
          {showCalendar && !showSummary && (
            <div className="overlay-base calendar-container"> {/* Külső overlay div */} 
              <div className="overlay-content" style={{ width: '95%', height: '95%', display: 'flex', flexDirection: 'column' }}>            {/* Belső tartalom konténer */} 
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

          {/* Időpontfoglalás összegzése (Overlay struktúrával) - az elem a graph-container-en belül */}
          {showSummary && currentSlot && (
            <div className="overlay-base appointment-summary"> {/* Külső overlay div */} 
              <div className="overlay-content">             {/* Belső tartalom konténer */} 
                <AppointmentSummary
                  slot={currentSlot}
                  summary={appointmentSummary}
                  onConfirm={handleConfirmAppointment}
                  onCancel={() => setShowSummary(false)}
                />
              </div>
            </div>
          )}
        </div>
        <div className="chatbox-container">
          <div className="ibr-header">
            <h2>I.B.R. asszisztens</h2>
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
          <FaLink style={{ marginRight: 5 }}/> Adatkapcsolatok kezelése 
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