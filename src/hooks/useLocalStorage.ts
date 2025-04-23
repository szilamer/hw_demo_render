import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Kezdeti érték betöltése localStorage-ból
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Hiba a localStorage olvasása során:', error);
      return initialValue;
    }
  });

  // localStorage frissítése amikor a state változik
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('Hiba a localStorage írása során:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
} 