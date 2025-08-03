import Home from "./pages/Home";
import "animate.css";
import { Routes, Route } from "react-router-dom";
import Signup from "./pages/SignUp";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Strategy from "./pages/Strategy";
import Chatbot from "./pages/Chatbot";

function App() {
  return (
    <div className="App">
      {/* <Home /> */}
      {/* <Login /> */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/campaign-strategy" element={<Strategy />} />
        <Route path="/chatbot" element={<Chatbot />} />
      </Routes>
    </div>
  );
}

export default App;
