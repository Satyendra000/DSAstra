import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import PrivateRoute from "./components/PrivateRoute";
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login/*" element={<Login />} />
        <Route path="/register/*" element={<Register />} />
        
        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Home />} />
        </Route>

        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
