import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CollaborationProvider } from './contexts/CollaborationContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CollaborationProvider>
      <App />
    </CollaborationProvider>
  </StrictMode>,
)
