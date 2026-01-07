import React from 'react';
import { CourseProvider } from '../contexts/CourseContext';

/**
 * AppWrapper - Provider per l'intera applicazione
 * * Fornisce il contesto del corso a tutti i componenti
 * * Da wrappare intorno all'app principale in main.jsx
 */
export function AppWrapper({ children }) {
  return (
    <CourseProvider>
      {children}
    </CourseProvider>
  );
}
