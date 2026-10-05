import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import './styles/main.scss'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'

// Google Website Translator (AutoTranslate) replaces translated text nodes. Without this guard
// React can throw when it later removes or inserts around a node the translator moved.
const originalRemoveChild = Node.prototype.removeChild
Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
  if (child.parentNode !== this) return child
  return originalRemoveChild.call(this, child) as T
}
const originalInsertBefore = Node.prototype.insertBefore
Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, reference: Node | null): T {
  if (reference && reference.parentNode !== this) return node
  return originalInsertBefore.call(this, node, reference) as T
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Listings change rarely; avoid refetching on every page visit.
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
