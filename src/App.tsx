import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard'; 

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </div>
  );
}

export default App;