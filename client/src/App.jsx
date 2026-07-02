import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Problems from "./pages/Problems";
import EditorPage from "./pages/Editor";
import Settings from "./pages/Settings";
import PrivateRoute from "./components/PrivateRoute";
import BootLoader from "./components/BootLoader";
import "./index.css";

function App() {
  const [showBootLoader, setShowBootLoader] = useState(() => {
    return !sessionStorage.getItem("hasSeenBootLoader");
  });

  const handleBootComplete = () => {
    sessionStorage.setItem("hasSeenBootLoader", "true");
    setShowBootLoader(false);
  };

  if (showBootLoader) {
    return <BootLoader onComplete={handleBootComplete} />;
  }

  return (
    <Router>
        <Routes>
          <Route path="/login/*" element={<Login />} />
        <Route path="/register/*" element={<Register />} />
        
        {/* Main Routes (Guest Mode Enabled) */}
        <Route path="/" element={<Home />} />
        <Route path="/problems" element={<Problems />} />
        <Route path="/editor/:id" element={<EditorPage />} />
        
        {/* Private Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
