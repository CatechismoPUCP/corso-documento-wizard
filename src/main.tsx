/**
 * Main entry point for the Course Document Wizard application.
 * This file initializes the React application and renders the root App component.
 */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Get the root element and create React root
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a div with id="root" in your HTML.');
}

// Render the main App component
createRoot(rootElement).render(<App />);
