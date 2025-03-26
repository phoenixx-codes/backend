import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { StrictMode } from 'react'
import ThemeProvider from './theme/ThemeProvider'

// Create root element if it doesn't exist
const rootElement = document.getElementById('root')
if (!rootElement) {
  const root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
