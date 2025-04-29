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
import { FaUserMd, FaHeartbeat, FaLink, FaCalculator, FaChartLine, FaProjectDiagram, FaQuestionCircle } from 'react-icons/fa'; // Added FaQuestionCircle

// Környezeti változók beolvasása
// const CHAT_WEBHOOK_URL = process.env.REACT_APP_CHAT_WEBHOOK_URL || '/webhook/webhook';  // Chat üzenetek kezelése
// const CHAT_WEBHOOK_URL = process.env.REACT_APP_CHAT_WEBHOOK_URL; // Chat üzenetek kezelése
const CHAT_WEBHOOK_URL = 'http://n8nalfa.hwnet.local:5678/webhook/webhook'; // Local Docker Webhook URL
// const CHAT_WEBHOOK_URL = 'http://n8nalfa.hwnet.local:5678/webhook/webhook'; // Local Docker Webhook URL // Ezt kikommentelem
// const CHAT_WEBHOOK_URL = 'https://n8n-tc2m.onrender.com/webhook/webhook'; // PRODUCTION Webhook URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || ''; // Backend API base URL

// --- Alapértelmezett események és csomópontok ---
const initialPatientEvents: TimelineItem[] = [
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
  /* // Eltávolítva alapértelmezettként, feltételesen adjuk hozzá
  {
    id: 'lab_2020_10_08',
    content: 'Laborvizsgálat',
    start: new Date('2020-10-08'),
    documents: [{ id: 'doc_lab_2020_10_08', title: 'Laborlelet 2020-10-08', url: 'lab_20201008_cb.pdf', type: 'pdf' }]
  }
  */
];

const initialPatientNodes: GraphNode[] = [
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
  { id: 'lab_we_2020_04_23', label: 'Süllyedés: 69 mm/h', type: 'labValue', timestamp: new Date('2020-04-23') },

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
  { id: 'lab_we_2020_10_08', label: 'Süllyedés: 63 mm/h', type: 'labValue', timestamp: new Date('2020-10-08') },
  { id: 'lab_we_2020_10_08_2', label: 'Süllyedés: 63 mm/h', type: 'labValue', timestamp: new Date('2020-10-08') }
];

// --- Alapértelmezett gráf kapcsolatok ---
const initialPatientEdges: GraphEdge[] = [
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
  { from: 'ra', to: 'lab_we_2014_09_23', label: 'indikátor' },
  { from: 'lab_we_2020_04_23', to: 'lab_node_2020_04_23' }
];

// --- Feltételesen megjelenítendő adatok ('2020-10-08') ---
const conditionalEvents: TimelineItem[] = [
   {
    id: 'lab_2020_10_08',
    content: 'Laborvizsgálat (Új)', // Megkülönböztető label
    start: new Date('2020-10-08'),
    documents: [{ id: 'doc_lab_2020_10_08', title: 'Laborlelet 2020-10-08', url: 'lab_20201008_cb.pdf', type: 'pdf' }],
    className: 'conditional-event' // Opcionális: CSS osztály a stílushoz
  }
];

const conditionalNodes: GraphNode[] = [
  { id: 'lab_node_2020_10_08', label: 'Laborvizsgálat (Új)', type: 'lab', timestamp: new Date('2020-10-08'), className: 'conditional-node' },
  { id: 'lab_crp_2020_10_08', label: 'CRP: 57 mg/L (Új)', type: 'labValue', timestamp: new Date('2020-10-08'), className: 'conditional-node' },
  { id: 'lab_we_2020_10_08', label: 'Süllyedés: 63 mm/h (Új)', type: 'labValue', timestamp: new Date('2020-10-08'), className: 'conditional-node' }
];

const conditionalEdges: GraphEdge[] = [
  // Ide jönnek majd a 2020-10-08-hoz tartozó kapcsolatok
  // Példa: feltételezve, hogy a 'progression' csomóponthoz kapcsolódik
  { from: 'lab_node_2020_10_08', to: 'progression', className: 'conditional-edge' },
  { from: 'lab_crp_2020_10_08', to: 'lab_node_2020_10_08', className: 'conditional-edge' },
  { from: 'lab_we_2020_10_08', to: 'lab_node_2020_10_08', className: 'conditional-edge' }
];

// --- Komponens ---
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

// --- Teljes betegadatok (beleértve a kezdetben rejtett '2020-10-08'-at) ---
const allPatientEvents: TimelineItem[] = [
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
  /* // Eltávolítva alapértelmezettként, feltételesen adjuk hozzá
  {
    id: 'lab_2020_10_08',
    content: 'Laborvizsgálat',
    start: new Date('2020-10-08'),
    documents: [{ id: 'doc_lab_2020_10_08', title: 'Laborlelet 2020-10-08', url: 'lab_20201008_cb.pdf', type: 'pdf' }]
  }
  */
  {
    id: 'lab_2020_10_08',
    content: 'Laborvizsgálat (Új)', // Megkülönböztető label
    start: new Date('2020-10-08'),
    documents: [{ id: 'doc_lab_2020_10_08', title: 'Laborlelet 2020-10-08', url: 'lab_20201008_cb.pdf', type: 'pdf' }],
    className: 'conditional-event' // Opcionális: CSS osztály a stílushoz
  }
];

const allPatientNodes: GraphNode[] = [
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
  { id: 'lab_we_2020_04_23', label: 'Süllyedés: 69 mm/h', type: 'labValue', timestamp: new Date('2020-04-23') },

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
  { id: 'lab_we_2020_10_08', label: 'Süllyedés: 63 mm/h', type: 'labValue', timestamp: new Date('2020-10-08') },
  { id: 'lab_we_2020_10_08_2', label: 'Süllyedés: 63 mm/h', type: 'labValue', timestamp: new Date('2020-10-08') }
];

// --- Alapértelmezett gráf kapcsolatok ---
const allPatientEdges: GraphEdge[] = [
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
  { from: 'ra', to: 'lab_we_2014_09_23', label: 'indikátor' },
  { from: 'lab_we_2020_04_23', to: 'lab_node_2020_04_23' },
  { from: 'ra', to: 'lab_we_2020_10_08', label: 'indikátor' }
];

// --- Esemény és csomópont közötti megfeleltetés (teljes adathoz) ---
const fullEventToNodeMap: Record<string, string> = {
   'ev1': 'diag1', 'ev2': 'ctrl1', 'ev3': 'ctrl2', 'ev4': 'flare1', 'ev5': 'bio1_start',
   'ev6': 'ctrl3', 'ev7': 'flare2', 'ev8': 'ctrl4', 'ev9': 'bio2_start', 'ev10': 'ctrl5',
   'ev11': 'progression',
   'lab_2014_09_23': 'lab_node_2014_09_23', 'lab_2015_03_24': 'lab_node_2015_03_24',
   'lab_2015_09_21': 'lab_node_2015_09_21', 'lab_2016_04_07': 'lab_node_2016_04_07',
   'lab_2016_07_08': 'lab_node_2016_07_08', 'lab_2017_03_06': 'lab_node_2017_03_06',
   'lab_2017_09_13': 'lab_node_2017_09_13', 'lab_2018_04_19': 'lab_node_2018_04_19',
   'lab_2018_10_25': 'lab_node_2018_10_25', 'lab_2019_04_16': 'lab_node_2019_04_16',
   'lab_2020_04_23': 'lab_node_2020_04_23',
   'lab_2020_10_08': 'lab_node_2020_10_08'
};

const fullNodeToEventMap: Record<string, string> = Object.entries(fullEventToNodeMap).reduce(
  (acc: Record<string, string>, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {}
);

// --- Komponens ---
interface AppointmentSlot extends AppointmentEvent {
  id: string;
  isSelected?: boolean;
}

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
  const [editingEvent, setEditingEvent] = useState<TimelineItem | null>(null);
  // State to control the main panel view
  const [mainPanelView, setMainPanelView] = useState<MainPanelView>('graph'); 

  // ÚJ: Állapot a legutóbbi események láthatóságához
  const [showLatestEvents, setShowLatestEvents] = useState(false);
  const targetDate = new Date('2020-10-08').getTime(); // A cél dátum időbélyege

  // Memoizált, SZŰRT adatok a megjelenítéshez
  const displayedTimelineItems = useMemo(() => {
    if (showLatestEvents) {
      return allPatientEvents;
    }
    return allPatientEvents.filter(item => item.start.getTime() !== targetDate);
  }, [showLatestEvents]);

  const displayedGraphNodes = useMemo(() => {
    if (showLatestEvents) {
      return allPatientNodes;
    }
    return allPatientNodes.filter(node => node.timestamp?.getTime() !== targetDate);
  }, [showLatestEvents]);

  const displayedGraphEdges = useMemo(() => {
    if (showLatestEvents) {
      return allPatientEdges;
    }
    // Élek szűrése: csak azokat tartjuk meg, amelyek mindkét vége látható node
    const visibleNodeIds = new Set(displayedGraphNodes.map(n => n.id));
    return allPatientEdges.filter(edge => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to));
  }, [showLatestEvents, displayedGraphNodes]); // Függ a displayedGraphNodes-tól!

  // Esemény és csomópont közötti map generálása a LÁTHATÓ elemek alapján
  // Javítás: a destrukturálásnak meg kell egyeznie a visszatérési érték kulcsaival
  const { eventToNode: eventToNodeMap, nodeToEvent: nodeToEventMap } = useMemo(() => {
    const eventToNode: Record<string, string> = {};
    const nodeToEvent: Record<string, string> = {};
    const visibleEventIds = new Set(displayedTimelineItems.map(e => e.id));

    for (const eventId in fullEventToNodeMap) {
      const nodeId = fullEventToNodeMap[eventId];
      if (visibleEventIds.has(eventId)) { // Csak a látható eventek alapján
        eventToNode[eventId] = nodeId;
        if (displayedGraphNodes.some(n => n.id === nodeId)) {
           nodeToEvent[nodeId] = eventId;
        }
      }
    }
    // Visszatérési érték kulcsai: eventToNode, nodeToEvent
    return { eventToNode, nodeToEvent };
  }, [displayedTimelineItems, displayedGraphNodes]);


  // Példa userId, reason, patientHistory (ezeket érdemes később dinamikusan kezelni)
  const userId = 'kovacs_istvan';
  const reason = 'Rendszeres kontroll vizsgálat';
  const patientHistory = {}; // Kezdetben üres, később feltölthető

  // Idővonalon történő kiválasztás kezelése
  const handleTimelineSelect = (itemId: string | null) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (itemId === null) {
      // Ha nincs kiválasztott elem, visszaállunk az időtartomány alapú szűrésre
      setSelectedEvent(null);
      setSelectedNode(null);
      setShowAllNodes(false); // Kikapcsoljuk a "minden node" nézetet, ha volt
    } else {
      console.log('Kiválasztott idővonalas esemény:', itemId);
      setSelectedEvent(itemId);
      setShowAllNodes(false); // Fókuszáljunk a kiválasztott eseményre

      // Kapcsolódó gráf csomópont kiválasztása
      const nodeId = eventToNodeMap[itemId];
      if (nodeId) {
        setSelectedNode(nodeId);
      } else {
        setSelectedNode(null); // Ha nincs map, töröljük a node kiválasztást
      }
    }
    // Ha elemet választottunk az idővonalon, váltsunk a gráf nézetre és töröljük a metrika kiválasztást
    if (itemId) {
        setMainPanelView('graph');
        setSelectedMetric(null);
    }
  };

  // Időintervallum változás kezelése debounce-olással
  const handleTimeRangeChange = (start: Date, end: Date) => {
    console.log(`Timeline range changed: ${start.toISOString()} - ${end.toISOString()}`);
    
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

    // Késleltetéssel frissítjük a látható időtartományt, hogy ne legyen túl sok újrarajzolás
    timeoutRef.current = window.setTimeout(() => {
      setVisibleTimeRange({ start, end });
      
      // Ha volt kiválasztott esemény, töröljük, mert most időtartomány alapján szűrünk
      if (selectedEvent || selectedNode) {
        setSelectedEvent(null);
        setSelectedNode(null);
      }
    }, 300);
  };

  // Gráfban történő kiválasztás kezelése
  const handleGraphSelect = (nodeId: string) => {
    console.log('Kiválasztott gráf csomópont:', nodeId);
    setSelectedNode(nodeId);
    setShowAllNodes(false); // Fókuszáljunk a kiválasztott node-ra

    // Kapcsolódó idővonalas esemény kiválasztása
    const eventId = nodeToEventMap[nodeId];
    if (eventId) {
      setSelectedEvent(eventId);
    } else {
      setSelectedEvent(null); // Ha nincs map, töröljük az event kiválasztást
    }
    // Ha node-ot választottunk a gráfban, váltsunk a gráf nézetre és töröljük a metrika kiválasztást
    setMainPanelView('graph');
    setSelectedMetric(null);
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
    // Ha mindent mutatunk, kész
    if (showAllNodes) return displayedGraphNodes; 

    // Ha van kiválasztott node vagy esemény
    const focusedNodeId = selectedNode || (selectedEvent ? eventToNodeMap[selectedEvent] : null);
    
    if (focusedNodeId) {
      // Ha van kiválasztott elem (esemény VAGY csomópont)
      const connectedNodes = new Set<string>([focusedNodeId]);
      // Közvetlen szomszédok keresése
      displayedGraphEdges.forEach(edge => {
        if (edge.from === focusedNodeId) {
          connectedNodes.add(edge.to);
        } else if (edge.to === focusedNodeId) {
          connectedNodes.add(edge.from);
        }
      });

      // Betegség node hozzáadása, ha kapcsolódik a fókuszálthoz (opcionális, de hasznos lehet)
      if (displayedGraphNodes.some(n => n.id === 'ra') && displayedGraphEdges.some(e => 
          (e.from === focusedNodeId && e.to === 'ra') || (e.to === focusedNodeId && e.from === 'ra'))) {
        connectedNodes.add('ra');
      }

      // Csak a fókuszált és a közvetlen szomszédok mutatása
      return displayedGraphNodes.filter(node => connectedNodes.has(node.id));
    } else if (visibleTimeRange) {
      // Ha nincs kiválasztás, de van időtartomány, szűrés az alapján
      // Először keressük meg az időtartományba eső csomópontokat
      const nodesInTimeRange = new Set<string>();
      
      // Gyűjtsük össze az időtartományba eső csomópontok azonosítóit
      displayedGraphNodes.forEach(node => {
        if (node.timestamp && 
            node.timestamp >= visibleTimeRange.start && 
            node.timestamp <= visibleTimeRange.end) {
          nodesInTimeRange.add(node.id);
        }
      });
      
      // Betegség node-okat és a hozzájuk kapcsolódó éleket is vegyük figyelembe
      displayedGraphNodes.forEach(node => {
        if (node.type === 'disease') {
          // Ellenőrizzük, hogy kapcsolódik-e legalább egy, az időtartományba eső node-hoz
          const hasConnectionInTimeRange = displayedGraphEdges.some(edge => {
            if (edge.from === node.id) {
              return nodesInTimeRange.has(edge.to);
            } else if (edge.to === node.id) {
              return nodesInTimeRange.has(edge.from);
            }
            return false;
          });
          
          if (hasConnectionInTimeRange) {
            nodesInTimeRange.add(node.id);
          }
        }
      });
      
      // Szűrjük le a node-okat az összegyűjtött azonosítók alapján
      return displayedGraphNodes.filter(node => nodesInTimeRange.has(node.id));
    }
    
    // Alapértelmezett: minden aktuálisan megjeleníthető node
    return displayedGraphNodes; 
  }, [selectedEvent, selectedNode, visibleTimeRange, showAllNodes, displayedGraphNodes, displayedGraphEdges, eventToNodeMap]);

  // Memoizáljuk a látható éleket
  const visibleEdges = useMemo(() => {
    if (showAllNodes) return displayedGraphEdges;
    
    // Csak olyan éleket tartunk meg, amelyek mindkét vége látható node
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    return displayedGraphEdges.filter(edge =>
      visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to)
    );
  }, [visibleNodes, showAllNodes, displayedGraphEdges]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Fájl kiválasztva:', file.name);
      // console.log('Fájl kiválasztva, a \'2020-10-08\' események megjelenítése...');
      // setShowLatestEvents(true); // <-- TÖRÖLVE: Nem a fájl feltöltéskor kell megjeleníteni
      // A fájl input értékének törlése, hogy ugyanazt a fájlt újra ki lehessen választani
      event.target.value = '';
      // TODO: Ide kellene a tényleges fájlfeltöltési logika (pl. API hívás)
    }
  };

  // Demo időpontok generálása
  const generateDemoSlots = (): AppointmentSlot[] => {
    const now = new Date();
    const slots: AppointmentSlot[] = [];

    // Következő 5 munkanap, 10:00-kor és 14:00-kor
    let count = 0;
    for (let i = 1; count < 5; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);

      // Csak munkanapokon (1-5: hétfő-péntek)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        // 10:00
        const date10 = new Date(date);
        date10.setHours(10, 0, 0, 0);
        slots.push({
          title: 'Szabad időpont',
          start: new Date(date10),
          end: new Date(date10.getTime() + 30 * 60000), // 30 perc
          isAvailable: true,
          id: `slot-${date10.toISOString()}`
        });
        count++;
        if (count === 5) break;

        // 14:00
        const date14 = new Date(date);
        date14.setHours(14, 0, 0, 0);
         slots.push({
          title: 'Szabad időpont',
          start: new Date(date14),
          end: new Date(date14.getTime() + 30 * 60000), // 30 perc
          isAvailable: true,
          id: `slot-${date14.toISOString()}`
        });
        count++;
      }
    }
    return slots;
  };

  // Debug useEffect a showCalendar állapot változásának követéséhez
  useEffect(() => {
    console.log('showCalendar changed:', showCalendar);
    console.log('selectedMetric:', selectedMetric);
  }, [showCalendar, selectedMetric]);

  // Keep selectedMetric and mainPanelView in sync
  useEffect(() => {
    if (selectedMetric) {
      console.log('Setting mainPanelView to graph because selectedMetric is set');
      setMainPanelView('graph');
    }
  }, [selectedMetric]);

  const openAppointmentCalendar = async () => {
    console.log('openAppointmentCalendar called');
    const slots = generateDemoSlots();
    console.log('Generated slots:', slots);
    setSelectedMetric(null); // Töröljük a metrika kiválasztást
    setShowSummary(false); // Biztosan ne látszódjon az összegzés
    await new Promise(resolve => setTimeout(resolve, 50)); // Kis késleltetés a rendereléshez
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
          context: { // A kontextus küldése a LÁTHATÓ elemek alapján
            selectedMetric: selectedMetric ? healthMetrics.find(m => m.title === selectedMetric) : null,
            selectedEvent: selectedEvent ? displayedTimelineItems.find(e => e.id === selectedEvent) : null,
            selectedNode: selectedNode ? displayedGraphNodes.find(n => n.id === selectedNode) : null,
            visibleNodes: visibleNodes,
            visibleEdges: visibleEdges
          }
        })
      });

       if (!response.ok) {
        throw new Error(`Webhook hiba (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();

      if (data.response) {
        chatboxRef.current?.addMessage(data.response, 'assistant');

        // Ha a webhook válaszában van összegzés, akkor jelenítjük meg
        if (data.summary) {
          setAppointmentSummary(data.summary);
          setShowCalendar(false);
          setShowSummary(true);
        } else {
          // Ha nincs summary, zárjuk be a naptárat és az összegzést
           setShowCalendar(false);
           setShowSummary(false);
        }
      } else {
        // Ha nincs 'response' a webhook válaszban
        chatboxRef.current?.addMessage('A kiválasztott időpontra vonatkozóan nem érkezett szöveges visszajelzés.', 'assistant');
        setShowCalendar(false); // Zárjuk be a naptárat ilyenkor is?
        setShowSummary(false);
      }

    } catch (error) {
      console.error('Error in handleSlotSelect:', error);
      chatboxRef.current?.addMessage(
        `Hiba történt az időpont kiválasztásának feldolgozása során: ${error instanceof Error ? error.message : String(error)}`,
        'assistant'
      );
       setShowCalendar(false); // Hiba esetén is zárjuk be
       setShowSummary(false);
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
      // Context előkészítése (látható elemek alapján)
      let currentContext = {};
      if (selectedMetric) {
        const metricData = healthMetrics.find(m => m.title === selectedMetric);
        currentContext = {
          selectedMetric: metricData ? {
            name: metricData.title,
            value: metricData.value,
            unit: metricData.unit,
            status: metricData.status,
            description: metricDescriptions[selectedMetric]
          } : null,
          selectedEvent: null,
          selectedNode: null
        };
      } else {
        currentContext = {
          selectedMetric: null,
          selectedEvent: selectedEvent ? displayedTimelineItems.find(e => e.id === selectedEvent) : null,
          selectedNode: selectedNode ? displayedGraphNodes.find(n => n.id === selectedNode) : null
        };
      }

      const requestBody = {
          message: message,
          timestamp: Date.now(),
          context: {
            ...currentContext,
            // Mindig küldjük a LÁTHATÓ node-okat és éleket
            visibleNodes: visibleNodes,
            visibleEdges: visibleEdges
          }
      };

      console.log('Küldés a webhooknak:', JSON.stringify(requestBody, null, 2));

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

      // Naptár megnyitása, ha az n8n jelzi
      if (data && data.action === "open_calendar") {
        console.log("'open_calendar' action detektálva, naptár megnyitása...");
        await openAppointmentCalendar();
      }

      // Szöveges válasz megjelenítése
      const reply = data.response || data.message || data.output || null;
      if (reply) {
        callback(reply);
      } else {
        console.log('Nem érkezett megjeleníthető szöveges válasz az n8n-től.');
        // Optionally provide a default message if no text response is received
        // callback('Nem érkezett válasz.');
      }

    } catch (error) {
      console.error('Hiba az üzenetküldés során:', error);
      callback(`Hiba történt az üzenetküldés során: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Foglalás véglegesítését kezelő függvény
  const handleConfirmAppointment = async () => {
    try {
      if (!CHAT_WEBHOOK_URL) {
        console.error('Hiba: CHAT_WEBHOOK_URL nincs beállítva.');
        chatboxRef.current?.addMessage(
          'Hiba: Az időpontfoglalás véglegesítése jelenleg nem lehetséges (konfigurációs hiba).',
          'assistant'
        );
        return;
      }
       if (!currentSlot) {
         console.error('Hiba: Nincs kiválasztott időpont (currentSlot null).');
         chatboxRef.current?.addMessage(
           'Hiba: Nincs kiválasztott időpont a véglegesítéshez.',
           'assistant'
         );
         setShowSummary(false); // Összegző elrejtése hiba esetén
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
          action: "confirm_booking",
          slot: { // Küldjük a slot adatait újra
             start: format(new Date(currentSlot.start), 'yyyy-MM-dd HH:mm'),
             end: format(new Date(currentSlot.end), 'yyyy-MM-dd HH:mm'),
             title: currentSlot.title
           },
          summary: appointmentSummary,
          context: { // Aktuális kontextus küldése (látható elemek alapján)
            selectedMetric: selectedMetric ? healthMetrics.find(m => m.title === selectedMetric) : null,
            selectedEvent: selectedEvent ? displayedTimelineItems.find(e => e.id === selectedEvent) : null,
            selectedNode: selectedNode ? displayedGraphNodes.find(n => n.id === selectedNode) : null,
            visibleNodes: visibleNodes,
            visibleEdges: visibleEdges
          }
        })
      });

      if (!response.ok) {
         throw new Error(`Webhook hiba (${response.status}): ${response.statusText}`);
       }

      const data = await response.json();

      if (data.status === "success") {
        chatboxRef.current?.addMessage(
          data.response || 'Az időpontfoglalás sikeresen véglegesítve.',
          'assistant'
        );
        setShowSummary(false);
      } else {
         chatboxRef.current?.addMessage(
          data.response || 'Hiba történt a foglalás véglegesítése során.',
          'assistant'
        );
         // Hagyjuk nyitva az összegzőt, hogy újra próbálkozhasson? Vagy zárjuk be?
         // Most bezárjuk
         setShowSummary(false);
      }

    } catch (error) {
      console.error('Error during appointment confirmation:', error);
      chatboxRef.current?.addMessage(
        `Hálózati vagy szerverhiba történt a foglalás véglegesítése során: ${error instanceof Error ? error.message : String(error)}`,
        'assistant'
      );
      setShowSummary(false); // Hiba esetén is zárjuk be
    }
  };

  // Demo egészségügyi mérőszámok
   const healthMetrics = useMemo(() => [
    // ... (metrika definíciók változatlanok) ...
     {
       icon: '📈',
       title: 'DAS28',
       value: metricTimeSeries['DAS28'].length > 0 ? String(metricTimeSeries['DAS28'][metricTimeSeries['DAS28'].length - 1].value) : 'N/A',
       unit: '',
       status: metricTimeSeries['DAS28'].length > 0 ? (metricTimeSeries['DAS28'][metricTimeSeries['DAS28'].length - 1].value > 5.1 ? 'critical' : metricTimeSeries['DAS28'][metricTimeSeries['DAS28'].length - 1].value > 3.2 ? 'warning' : 'normal') : 'normal'
     },
     {
       icon: '🔥',
       title: 'CRP',
       value: metricTimeSeries['CRP'].length > 0 ? String(metricTimeSeries['CRP'][metricTimeSeries['CRP'].length - 1].value) : 'N/A',
       unit: 'mg/L',
       status: metricTimeSeries['CRP'].length > 0 ? (metricTimeSeries['CRP'][metricTimeSeries['CRP'].length - 1].value > 10 ? 'critical' : metricTimeSeries['CRP'][metricTimeSeries['CRP'].length - 1].value > 5 ? 'warning' : 'normal') : 'normal'
     },
     {
       icon: '⏳',
       title: 'Süllyedés (We)',
       value: metricTimeSeries['Süllyedés (We)'].length > 0 ? String(metricTimeSeries['Süllyedés (We)'][metricTimeSeries['Süllyedés (We)'].length - 1].value) : 'N/A',
       unit: 'mm/h',
       status: metricTimeSeries['Süllyedés (We)'].length > 0 ? (metricTimeSeries['Süllyedés (We)'][metricTimeSeries['Süllyedés (We)'].length - 1].value > 30 ? 'critical' : metricTimeSeries['Süllyedés (We)'][metricTimeSeries['Süllyedés (We)'].length - 1].value > 20 ? 'warning' : 'normal') : 'normal'
     },
     {
       icon: '🫀',
       title: 'Vérnyomás',
        value: metricTimeSeries['Vérnyomás'].length > 0 ? `${metricTimeSeries['Vérnyomás'][metricTimeSeries['Vérnyomás'].length - 1].systolic}/${metricTimeSeries['Vérnyomás'][metricTimeSeries['Vérnyomás'].length - 1].diastolic}` : 'N/A',
       unit: 'mmHg',
       status: 'normal' // Placeholder status for blood pressure
     },
     {
       icon: '👣',
       title: 'Napi lépésszám',
       value: metricTimeSeries['Napi lépésszám'].length > 0 ? String(metricTimeSeries['Napi lépésszám'][metricTimeSeries['Napi lépésszám'].length - 1].value) : 'N/A',
       unit: 'lépés',
       status: metricTimeSeries['Napi lépésszám'].length > 0 ? (metricTimeSeries['Napi lépésszám'][metricTimeSeries['Napi lépésszám'].length - 1].value < 3000 ? 'warning' : 'normal') : 'normal'
     }
   ], []); // Dependency on the base time series data if it changes


  // Az aktuális metrika (ha nincs kiválasztva, az első)
  const currentMetric = selectedMetric || metricKeys[0];
  const currentMetricObj = healthMetrics.find(m => m.title === currentMetric);
  const currentStatus = currentMetricObj?.status || 'normal';
  const currentStatusObj = statusDescriptions.find(s => s.label.toLowerCase().includes(currentStatus));


  // Function to open the edit form
  const handleEditEvent = (item: TimelineItem) => {
    console.log("Editing event:", item);
    const fullItem = allPatientEvents.find(e => e.id === item.id); // Az eredeti, teljes elemet keressük
    setEditingEvent(fullItem || item); // Ha megvan, azt adjuk át, különben a láthatót
  };

  // Function to handle adding a new event
  const handleAddEvent = async (event: TimelineItem) => {
     // Hozzáadás a TELJES adathalmazhoz (ha még nincs benne)
     if (!allPatientEvents.some(e => e.id === event.id)) {
         allPatientEvents.push(event);
         // TODO: Frissíteni kellene a 'nodes' és 'edges' tömböket is, ha szükséges
         // ... Node és Edge hozzáadása az `allPatientNodes`, `allPatientEdges` tömbhöz ...

         console.log("Új esemény hozzáadva (teljes listához):", event);
         // // Ha az új esemény dátuma a cél dátum, jelenítsük meg // <-- Régi logika törölve
         // if (event.start.getTime() === targetDate) {
         //     setShowLatestEvents(true);
         // }
         // // Force refresh - ideiglenes megoldás a useMemo frissítésére // <-- Régi logika törölve
         // setShowLatestEvents(prev => !prev);
         // setTimeout(() => setShowLatestEvents(prev => !prev), 0);
     } else {
         console.warn("Esemény már létezik:", event.id);
     }
     // setShowEventForm(false); // Eltávolítva, mert a state nem létezik

     // ÚJ: Mentés után jelenítsük meg a rejtett eseményeket
     setShowLatestEvents(true);
  };


  // Function to handle updating an existing event
  const handleUpdateEvent = async (updatedEvent: TimelineItem) => {
     // Frissítés a TELJES adathalmazban
    const eventIndex = allPatientEvents.findIndex(e => e.id === updatedEvent.id);
    if (eventIndex > -1) {
        const originalEvent = allPatientEvents[eventIndex]; // Eredeti esemény mentése a dátum összehasonlításhoz
        allPatientEvents[eventIndex] = updatedEvent;
        // Frissíteni kellene a kapcsolódó node-ot is az allPatientNodes-ban
        const nodeIndex = allPatientNodes.findIndex(n => nodeToEventMap[n.id] === updatedEvent.id || fullNodeToEventMap[n.id] === updatedEvent.id);
        if (nodeIndex > -1) {
            // Frissítsük a node labeljét, timestampját stb. az updatedEvent alapján
            allPatientNodes[nodeIndex] = {
                ...allPatientNodes[nodeIndex],
                label: updatedEvent.content, // Vagy más logika alapján
                timestamp: updatedEvent.start,
                // ... egyéb node property-k frissítése ...
            };
        }

        console.log("Esemény frissítve (teljes listában):", updatedEvent);
    }
    setEditingEvent(null); // Bezárjuk a formot

    // ÚJ: Mentés után jelenítsük meg a rejtett eseményeket
    setShowLatestEvents(true);
  };

  const handleMetricSelect = (metric: MetricKey) => {
    console.log('Metric box clicked:', metric);
    console.log('Setting main panel view to graph and selected metric to:', metric);
    // Set the selected metric and change main panel view to 'graph'
    setSelectedMetric(metric);
    setMainPanelView('graph');

    // Find the details of the clicked metric
    const clickedMetricData = healthMetrics.find(m => m.title === metric);
    const patientFirstName = "Julianna"; // Assuming patient's first name

    if (clickedMetricData && CHAT_WEBHOOK_URL) {
      const prompt = `Kedves ${patientFirstName}, mindez mit jelent rám nézve? Kérem magyarázza el, hogy a(z) ${metric} metrika (${clickedMetricData.value} ${clickedMetricData.unit}, ${clickedMetricData.status} státusz) mit jelent az általános állapotom kontextusában.`;

      chatboxRef.current?.addMessage(`Kérdés a kiválasztott ${metric} metrikáról...`, 'user');
      
      // Beállítjuk a chatbox loading állapotát
      chatboxRef.current?.setLoading(true);

      // Send request to n8n agent
      fetch(CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: prompt,
          context: {
            selectedMetric: clickedMetricData,
            // Include other relevant context if needed, similar to handleSlotSelect
            selectedEvent: selectedEvent ? displayedTimelineItems.find(e => e.id === selectedEvent) : null,
            selectedNode: selectedNode ? displayedGraphNodes.find(n => n.id === selectedNode) : null,
            visibleNodes: visibleNodes,
            visibleEdges: visibleEdges
          }
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Webhook hiba (${response.status}): ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        // Kikapcsoljuk a loading állapotot
        chatboxRef.current?.setLoading(false);
        
        if (data.response) {
          chatboxRef.current?.addMessage(data.response, 'assistant');
        } else {
          chatboxRef.current?.addMessage('Nem érkezett válasz a metrika értelmezésére.', 'assistant');
        }
      })
      .catch(error => {
        // Hiba esetén is kikapcsoljuk a loading állapotot
        chatboxRef.current?.setLoading(false);
        
        console.error('Error sending metric explanation request:', error);
        chatboxRef.current?.addMessage(
          `Hiba történt a metrika értelmezésének kérése során: ${error instanceof Error ? error.message : String(error)}`,
          'assistant'
        );
      });

    } else if (!CHAT_WEBHOOK_URL) {
       console.error('CHAT_WEBHOOK_URL is not defined. Cannot send metric explanation request.');
       chatboxRef.current?.addMessage(
         "Hiba: A chat funkció nincs konfigurálva (hiányzó Webhook URL).",
         'assistant'
       );
    }
  }

  // Modified showGraphView function to clear metric selection
  const showGraphView = () => {
    console.log('Showing graph view');
    setMainPanelView('graph');
    setSelectedMetric(null); // This will also hide the timeline overlay
    setShowAllNodes(true); // Show all visible nodes
  }

  // Function to handle switching the main panel view
  const showDataConnections = () => {
    setMainPanelView('connections');
    setSelectedMetric(null);
    setSelectedEvent(null);
    setSelectedNode(null);
  };

  const showFinancingPlanner = () => {
    setMainPanelView('financing');
    setSelectedMetric(null);
    setSelectedEvent(null);
    setSelectedNode(null);
  };

  // A komponens return része innen kezdődik

  return (
    <div className="app-container">
      <div className="header-container">
        <h1 style={{ textAlign: 'center', color: '#4e73df', marginBottom: '15px' }}>Intelligens Egészségtámogató Rendszer</h1>
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
              position: 'relative', // Added for absolute positioning of icon
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
            {/* Question mark icon added */}
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              fontSize: '14px',
              color: '#aaa', // Subtle color
              cursor: 'help' // Indicate help/info on hover
            }}>
              <FaQuestionCircle />
            </span>
            {/* Existing content */}
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
        <Timeline
          items={displayedTimelineItems}
          onSelect={handleTimelineSelect}
          onRangeChange={handleTimeRangeChange}
          onAddEvent={handleAddEvent}
          onEditEvent={handleEditEvent}
        />
        {selectedMetric && mainPanelView === 'graph' && (
          <div style={{ 
            position: 'absolute', 
            left: 15, 
            right: 15, 
            top: 10, 
            bottom: 10,
            height: 'auto',
            background: 'white', 
            borderRadius: 12, 
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)', 
            padding: '20px', 
            overflow: 'hidden', 
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div className="view-header" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
              <h3 style={{ marginBottom: 15, fontWeight: 600, fontSize: 20 }}>{selectedMetric} időbeli alakulása</h3>
              <button className="close-button-x" onClick={() => {
                console.log('Closing timeline view');
                setSelectedMetric(null);
              }}>×</button>
            </div>
            <div style={{ width: '100%', paddingRight: 20 }}>
              <ResponsiveContainer width="100%" height={120}>
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
                {/* JAVÍTOTT GOMB FELTÉTEL */} 
                {!showAllNodes && (selectedEvent || selectedNode) && (
                  <button 
                    className="button reset-view-button"
                    onClick={showGraphView} // Ez a függvény már helyesen működik
                  >
                    🔄 Összes kapcsolat mutatása
                  </button>
                )}
              </div>
              <div className="graph-inner">
                <Graph
                  key={`graph-${visibleNodes.length}-${visibleEdges.length}`} // <-- ÚJ: Key prop a frissítés kényszerítéséhez
                  nodes={visibleNodes}    // A SZŰRT/LÁTHATÓ node-okat adjuk át
                  edges={visibleEdges}    // A SZŰRT/LÁTHATÓ éleket adjuk át
                  onSelect={handleGraphSelect}
                />
              </div>
            </>
          )}

          {selectedMetric && mainPanelView === 'graph' && (
            <div style={{ margin: '0 0 20px 0', background: '#f8f9fa', borderRadius: 8, padding: 20, fontSize: 15, height: '100%', overflowY: 'auto' }}>
              <div className="view-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="metric-icon" style={{ fontSize: '24px' }}>
                    {healthMetrics.find(m => m.title === selectedMetric)?.icon}
                  </div>
                  <h3 style={{ margin: 0 }}>{metricDescriptions[selectedMetric]}</h3>
                </div>
                <button onClick={() => setSelectedMetric(null)} className="close-button-x">×</button>
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

          {mainPanelView === 'metric' && selectedMetric && (
            <div style={{ margin: '0 0 20px 0', background: '#f8f9fa', borderRadius: 8, padding: 20, fontSize: 15, height: '100%', overflowY: 'auto' }}>
              <div className="view-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="metric-icon" style={{ fontSize: '24px' }}>
                    {healthMetrics.find(m => m.title === selectedMetric)?.icon}
                  </div>
                  <h3 style={{ margin: 0 }}>{metricDescriptions[selectedMetric]}</h3>
                </div>
                <button onClick={showGraphView} className="close-button-x">×</button>
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
              <div className="view-header">
                <h2>Válassza ki az IBT adatforrásait.</h2>
                <button onClick={showGraphView} className="close-button-x">×</button>
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
              <div className="view-header">
                <h2 style={{ color: '#4e73df' }}>Betegségfinanszírozás tervező</h2>
                <button onClick={showGraphView} className="close-button-x">×</button>
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
          
          {/* Naptár megjelenítése (Overlay struktúrával) - az elem a graph-container-en belül */}
          {showCalendar && !showSummary && (
            <div className="overlay-base calendar-container"> {/* Külső overlay div */} 
              <div className="overlay-content" style={{ width: '95%', height: '95%', display: 'flex', flexDirection: 'column' }}>
                <div className="view-header">
                  <h3 style={{ margin: 0 }}>Időpontfoglalás</h3>
                  <button 
                    onClick={() => {
                      setShowCalendar(false);
                      setMainPanelView('graph');
                    }}
                    className="close-button-x"
                  >
                    ×
                  </button>
                </div>
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
          <div className="ier-header">
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