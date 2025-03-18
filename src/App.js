import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { GoogleOAuthProvider } from "@react-oauth/google";
import axios from "axios";

// Theme
import { ColorModeContext, useMode } from "./theme";

// Layouts
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";

// Auth Pages
import Login from "./components/Login";
import Register from "./components/Register";
import Profile from "./components/Profile";

// Dashboard Pages
import Dashboard from "./scenes/dashboard";
import Team from "./scenes/team";
import Invoices from "./scenes/invoices";
import Contacts from "./scenes/SCI";
import Contacts1 from "./scenes/BKI";
import Contacts2 from "./scenes/SI";
import Bar from "./scenes/bar";
import Form from "./scenes/form";
import Line from "./scenes/line";
import Pie from "./scenes/pie";
import FAQ from "./scenes/faq";
import Geography from "./scenes/geography";
import Calendar from "./scenes/calendar/calendar";

// Set up axios defaults
axios.defaults.baseURL = "http://localhost:5000";

// Authentication wrapper
const PrivateRoute = ({ children, auth, adminOnly = false }) => {
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && auth.user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);
  const navigate = useNavigate();
  
  // Authentication state
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    // Check if user is authenticated on app load
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setAuth({
          isAuthenticated: false,
          isLoading: false,
          user: null,
        });
        return;
      }
      
      try {
        // Set default Authorization header for all requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        
        // Verify token by getting profile
        const response = await axios.get("/api/auth/profile");
        
        if (response.data.user) {
          setAuth({
            isAuthenticated: true,
            isLoading: false,
            user: response.data.user,
          });
        } else {
          // Token invalid, clear localStorage
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          
          setAuth({
            isAuthenticated: false,
            isLoading: false,
            user: null,
          });
          
          navigate("/login");
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        
        // Clear localStorage on auth error
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        
        setAuth({
          isAuthenticated: false,
          isLoading: false,
          user: null,
        });
        
        navigate("/login");
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Logout function
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (token) {
        await axios.post("/api/auth/logout", { token });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Update auth state
      setAuth({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
      
      // Navigate to login
      navigate("/login");
    }
  };

  // Loading state
  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <GoogleOAuthProvider clientId="358211076004-ebslpshqkmr9inhqn6qnm1utjacpojgg.apps.googleusercontent.com">
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          
          {auth.isAuthenticated ? (
            <div className="app" style={{ display: "flex", height: "100vh" }}>
              <Sidebar isSidebar={isSidebar} auth={auth} />
              <main className="content" style={{ flexGrow: 1, overflow: "auto" }}>
                <Topbar setIsSidebar={setIsSidebar} auth={auth} onLogout={handleLogout} />
                <Routes>
                  <Route path="/" element={<PrivateRoute auth={auth}><Dashboard /></PrivateRoute>} />
                  <Route path="/profile" element={<PrivateRoute auth={auth}><Profile auth={auth} setAuth={setAuth} /></PrivateRoute>} />
                  <Route path="/team" element={<PrivateRoute auth={auth} adminOnly={true}><Team /></PrivateRoute>} />
                  <Route path="/contacts" element={<PrivateRoute auth={auth}><Contacts /></PrivateRoute>} />
                  <Route path="/contacts1" element={<PrivateRoute auth={auth}><Contacts1 /></PrivateRoute>} />
                  <Route path="/contacts2" element={<PrivateRoute auth={auth}><Contacts2 /></PrivateRoute>} />
                  <Route path="/invoices" element={<PrivateRoute auth={auth}><Invoices /></PrivateRoute>} />
                  <Route path="/form" element={<PrivateRoute auth={auth}><Form /></PrivateRoute>} />
                  <Route path="/bar" element={<PrivateRoute auth={auth}><Bar /></PrivateRoute>} />
                  <Route path="/pie" element={<PrivateRoute auth={auth}><Pie /></PrivateRoute>} />
                  <Route path="/line" element={<PrivateRoute auth={auth}><Line /></PrivateRoute>} />
                  <Route path="/faq" element={<PrivateRoute auth={auth}><FAQ /></PrivateRoute>} />
                  <Route path="/calendar" element={<PrivateRoute auth={auth}><Calendar /></PrivateRoute>} />
                  <Route path="/geography" element={<PrivateRoute auth={auth}><Geography /></PrivateRoute>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          ) : (
            <Routes>
              <Route path="/login" element={<Login setAuth={setAuth} />} />
              <Route path="/register" element={<Register setAuth={setAuth} />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          )}
        </ThemeProvider>
      </ColorModeContext.Provider>
    </GoogleOAuthProvider>
  );
}

export default App;