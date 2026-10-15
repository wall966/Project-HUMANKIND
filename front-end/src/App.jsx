import { BrowserRouter, Routes, Route } from 'react-router';
import './App.css';
import Welcome from './Welcome';
import Register from './Register';
import Formulaire from './Formulaire';
import Dashboard from './Dashboard';

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Welcome/>} /> 
      <Route path="/register" element={<Register/>} /> 
      <Route path="/formulaire" element={<Formulaire/>} />
      <Route path="/dashboard" element={<Dashboard/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;

