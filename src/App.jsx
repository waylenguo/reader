import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import BookList from './components/BookList'
import Reader from './components/Reader'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BookList />} />
        <Route path="/reader/:bookId" element={<Reader />} />
      </Routes>
    </Router>
  )
}

export default App
