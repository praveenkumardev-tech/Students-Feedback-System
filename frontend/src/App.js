import { useEffect } from "react";
import "./App.css";
import { HashRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import StudentView from "./components/StudentView";
import AdminView from "./components/AdminView";
import Navigation from "./components/Navigation";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const helloWorldApi = async () => {
    try {
      const response = await axios.get(`${API}/`);
      console.log(response.data.message);
    } catch (e) {
      console.error(e, `errored out requesting / api`);
    }
  };

  useEffect(() => {
    helloWorldApi();
  }, []);

  return (
    <div>
      <Navigation />
      <StudentView />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/student/:formId" 
            element={
              <div>
                <Navigation />
                <StudentView />
              </div>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <div>
                <Navigation />
                <AdminView />
              </div>
            } 
          />
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;