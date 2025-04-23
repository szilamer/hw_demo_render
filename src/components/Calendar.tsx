import React from 'react';
import { Calendar as BigCalendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/hu';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('hu');
const localizer = momentLocalizer(moment);

interface CalendarProps {
  onBack: () => void;
  suggestedSlots: AppointmentEvent[];
  onSelectSlot?: (slot: AppointmentEvent) => Promise<void>;
}

export interface AppointmentEvent extends Event {
  title: string;
  start: Date;
  end: Date;
  isAvailable?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ onBack, suggestedSlots, onSelectSlot }) => {
  console.log('Calendar component rendered with slots:', suggestedSlots);
  
  const events: AppointmentEvent[] = suggestedSlots.map(slot => ({
    ...slot,
    title: '✅ Szabad időpont',
    className: 'available-slot'
  }));

  console.log('Processed events:', events);

  const handleSelectEvent = async (event: AppointmentEvent) => {
    if (event.isAvailable && onSelectSlot) {
      if (window.confirm(`Szeretné lefoglalni ezt az időpontot: ${moment(event.start).format('YYYY. MMMM DD. HH:mm')}?`)) {
        await onSelectSlot(event);
        onBack();
      }
    }
  };

  return (
    <div className="calendar-container" style={{ height: '100%', padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={onBack}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Vissza a gráfhoz
        </button>
        {suggestedSlots.length > 0 && (
          <div style={{ 
            backgroundColor: '#e8f5e9', 
            padding: '10px', 
            borderRadius: '4px',
            border: '1px solid #81c784'
          }}>
            {suggestedSlots.length} szabad időpont található
          </div>
        )}
      </div>
      <div style={{ height: 'calc(100% - 60px)' }}>
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          messages={{
            next: "Következő",
            previous: "Előző",
            today: "Ma",
            month: "Hónap",
            week: "Hét",
            day: "Nap"
          }}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={(event: AppointmentEvent) => ({
            style: {
              backgroundColor: event.isAvailable ? '#4caf50' : '#e0e0e0',
              border: 'none',
              borderRadius: '4px',
              color: 'white'
            }
          })}
        />
      </div>
    </div>
  );
};

export default Calendar; 