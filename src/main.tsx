import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from 'react-router-dom'

import { SessionsContextProvider } from './contexts/SessionsContext'

import App from './routes/App'
import './index.css'
import Crops from './routes/Crops'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<App />}>
      <Route path='crops' element={<Crops />} />
      <Route index element={<Navigate to='crops' />} />
    </Route>
  )
)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SessionsContextProvider>
      <RouterProvider router={router} />
    </SessionsContextProvider>
  </React.StrictMode>
)
