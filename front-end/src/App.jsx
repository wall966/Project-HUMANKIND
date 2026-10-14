import { BrowserRouter, Routes, Route } from 'react-router';
import './App.css';
import Welcome from './Welcome';
import Login from './Login';
import Formulaire from './Formulaire';

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Welcome/>} /> 
      <Route path="/login" element={<Login/>} /> 
      <Route path="/formulaire" element={<Formulaire/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;

