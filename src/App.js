import './App.css';

/*Bootstrap*/
import 'bootstrap/dist/css/bootstrap.min.css';
import Dashboard from './Components/Dashboard';
import Authenticated from './Components/Authenticated/Authenticated';

import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="authenticated" element={<Authenticated />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App