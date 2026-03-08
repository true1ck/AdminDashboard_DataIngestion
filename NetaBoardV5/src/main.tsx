import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LangProvider } from './context/LangContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </React.StrictMode>
)

// S4.4: Web Vitals reporting
import { onCLS, onINP, onLCP } from 'web-vitals';
onCLS(console.log); onINP(console.log); onLCP(console.log);
