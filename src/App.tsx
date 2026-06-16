import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SetupPage } from './pages/SetupPage'
import { GamePage  } from './pages/GamePage'
import { WinPage   } from './pages/WinPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"      element={<SetupPage />} />
        <Route path="/game"  element={<GamePage  />} />
        <Route path="/win"   element={<WinPage   />} />
        <Route path="*"      element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
