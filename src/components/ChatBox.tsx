import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

interface Message {
  message: string;
  sender: 'user' | 'assistant';
}

interface ChatBoxProps {
  selectedEvent: string | null;
  selectedNode: string | null;
  onSendMessage: (message: string, addResponse: (response: string) => void) => Promise<void>;
}

export interface ChatBoxHandle {
  addMessage: (message: string, sender: 'user' | 'assistant') => void;
  getHistory: () => Message[];
}

const ChatBox = forwardRef<ChatBoxHandle, ChatBoxProps>(({ selectedEvent, selectedNode, onSendMessage }, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Automatikus görgetés az új üzeneteknél
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Üzenet hozzáadása a chat történethez
  const addMessage = useCallback((text: string, sender: 'user' | 'assistant') => {
    console.log(`Adding message: Sender=${sender}, Text=${text}`);
    const newMessage: Message = {
      message: text,
      sender
    };
    setMessages(prev => Array.isArray(prev) ? [...prev, newMessage] : [newMessage]);
  }, []);

  // Expose addMessage method through ref
  useImperativeHandle(ref, () => ({
    addMessage,
    getHistory: () => messages
  }));

  // Üzenet küldése
  const handleSend = async () => {
    if (inputValue.trim() === '') return;

    try {
      addMessage(inputValue, 'user');
      setInputValue('');
      setIsLoading(true);

      await onSendMessage(inputValue, (response) => {
        addMessage(response, 'assistant');
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba';
      console.error('Chat hiba:', errorMessage);
      addMessage('A chat szolgáltatás átmenetileg nem elérhető. Kérjük, próbálja újra később.', 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  // Enter lenyomására üzenet küldése
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chatbox">
      <div className="chat-messages">
        {Array.isArray(messages) && messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.sender === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-content">
              {message.message}
            </div>
            <div className="message-timestamp">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant-message">
            <div className="message-content">
              <div className="loading">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Írj egy üzenetet..."
          rows={3}
          disabled={isLoading}
        />
        <button 
          className="button send-button" 
          onClick={handleSend}
          disabled={isLoading || inputValue.trim() === ''}
        >
          {isLoading ? '...' : '📤 Küldés'}
        </button>
      </div>
    </div>
  );
});

export default ChatBox; 