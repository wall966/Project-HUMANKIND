import { BrowserRouter, Routes, Route } from 'react-router';
import './App.css';
import Welcome from './Welcome';
import Register from './Register';
import Formulaire from './Formulaire';
import Dashboard from './Dashboard';
import Compte from './Compte';
import Admin from './Admin';

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Welcome/>} /> 
      <Route path="/register" element={<Register/>} /> 
      <Route path="/formulaire" element={<Formulaire/>} />
      <Route path="/annonces" element={<Dashboard/>} />
      <Route path="/dashboard" element={<Dashboard/>} />
      <Route path="/compte" element={<Compte/>} />
      <Route path="/admin" element={<Admin/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;

