import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { HomePage } from "./components/pages/HomePage";
import { StorePage } from "./components/pages/StorePage";
import { LibraryPage } from "./components/pages/LibraryPage";
import { Toaster } from "sonner"; // Import Toaster

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/store" element={<StorePage />} />
        <Route path="/library" element={<LibraryPage />} />
      </Routes>
      <Toaster richColors /> {/* Add Toaster component */}
    </Router>
  );
}

export default App;