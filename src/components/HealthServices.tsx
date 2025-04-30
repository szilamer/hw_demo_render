import React from 'react';
import { ChatBoxHandle } from './ChatBox';

interface HealthServicesProps {
  chatBoxRef: React.RefObject<ChatBoxHandle>;
}

const healthServices = [
  {
    id: 'preventive-screening',
    title: 'Preventív Szűrővizsgálat',
    description: 'Átfogó egészségügyi állapotfelmérés és szűrővizsgálatok.',
    icon: '🏥'
  },
  {
    id: 'lifestyle-consultation',
    title: 'Életmód Tanácsadás',
    description: 'Személyre szabott táplálkozási és életmód tanácsadás.',
    icon: '🥗'
  },
  {
    id: 'chronic-care',
    title: 'Krónikus Betegséggondozás',
    description: 'Rendszeres kontroll és személyre szabott kezelési terv.',
    icon: '💊'
  }
];

const getServicePrompt = (serviceId: string) => {
  switch (serviceId) {
    case 'preventive-screening':
      return 'Kérlek magyarázd el, miért lenne hasznos számomra a preventív szűrővizsgálat az egészségügyi előzményeim alapján, és milyen konkrét vizsgálatokat javasolsz?';
    case 'lifestyle-consultation':
      return 'Az egészségügyi adataim alapján milyen életmódbeli változtatásokat javasolsz, és miért lenne hasznos számomra az életmód tanácsadás?';
    case 'chronic-care':
      return 'A krónikus betegséggondozási program hogyan segíthetne az én esetemben az egészségügyi állapotom alapján?';
    default:
      return '';
  }
};

const HealthServices: React.FC<HealthServicesProps> = ({ chatBoxRef }) => {
  const handleServiceClick = (serviceId: string) => {
    const prompt = getServicePrompt(serviceId);
    if (chatBoxRef.current && prompt) {
      chatBoxRef.current.addMessage(prompt, 'user');
    }
  };

  return (
    <div className="health-services">
      <h2>Ajánlott Szolgáltatások</h2>
      <div className="services-grid">
        {healthServices.map((service) => (
          <div
            key={service.id}
            className="service-card"
            onClick={() => handleServiceClick(service.id)}
          >
            <div className="service-icon">{service.icon}</div>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HealthServices; 