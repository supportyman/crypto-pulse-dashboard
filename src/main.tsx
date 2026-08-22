import { createRoot } from 'react-dom/client'
import App from './App'
import { ShogoErrorBoundary } from './ShogoErrorBoundary'
import './index.css'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <ShogoErrorBoundary>
      <App />
    </ShogoErrorBoundary>,
  )
}