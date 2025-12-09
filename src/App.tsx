import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { Game2048 } from './components/Game2048';
import { Calculator } from './components/Calculator';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/2048" element={<Game2048 />} />
                <Route path="/calculator" element={<Calculator />} />
            </Routes>
        </Router>
    );
}

export default App;
