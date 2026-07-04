import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, Button, TextField, Typography, useTheme, Paper, Divider, CircularProgress, Alert } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import GoogleIcon from "@mui/icons-material/Google";
import { tokens } from "../theme";
import Header from "./Header";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL.replace(/\/$/, "")}/api`
  : "/api";

const DEMO_EMAIL = "admin@dashboard.demo";
const DEMO_PASSWORD = "admin12345";

const Login = ({ setAuth }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const completeLogin = (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setAuth({ isAuthenticated: true, isLoading: false, user });
    navigate("/");
  };

  const demoFallbackLogin = () => {
    const email = formData.email.trim().toLowerCase();
    if (email !== DEMO_EMAIL || formData.password !== DEMO_PASSWORD) return false;

    completeLogin(
      {
        id: 1,
        name: "Demo Admin",
        email: DEMO_EMAIL,
        role: "admin",
        profile_picture: null,
      },
      "demo-local-token"
    );
    return true;
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post(`${API_URL}/auth/login`, formData);
      if (response.data && response.data.token) {
        completeLogin(response.data.user, response.data.token);
      }
    } catch (error) {
      console.error("Login error:", error);
      if (demoFallbackLogin()) return;
      setErrorMessage(error.response?.data?.message || "Login failed. Please redeploy latest commit and try again.");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      setLoading(true);
      setErrorMessage("");

      try {
        const userInfo = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${response.access_token}` },
        });

        const authResponse = await axios.post(`${API_URL}/auth/google-auth`, {
          token: response.access_token,
          googleData: userInfo.data,
        });

        if (authResponse.data && authResponse.data.token) {
          completeLogin(authResponse.data.user, authResponse.data.token);
        }
      } catch (error) {
        console.error("Google login error:", error);
        setErrorMessage("Google login failed. Please try again or use email login.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setErrorMessage("Google login failed. Please try again.");
    },
  });

  return (
    <Box m="20px" display="flex" justifyContent="center">
      <Paper
        elevation={3}
        sx={{
          maxWidth: "500px",
          width: "100%",
          p: 4,
          backgroundColor: colors.primary[400],
          borderRadius: "10px",
        }}
      >
        <Header title="LOGIN" subtitle="Sign in to your account" center />

        <Alert severity="info" sx={{ mb: 2 }}>
          Demo login: admin@dashboard.demo / admin12345
        </Alert>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box mb={2}>
            <TextField
              fullWidth
              variant="filled"
              type="email"
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{ startAdornment: <EmailIcon sx={{ mr: 1, color: colors.greenAccent[400] }} /> }}
              sx={{ "& .MuiFilledInput-root": { backgroundColor: colors.primary[500] } }}
            />
          </Box>

          <Box mb={3}>
            <TextField
              fullWidth
              variant="filled"
              type="password"
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{ startAdornment: <LockIcon sx={{ mr: 1, color: colors.greenAccent[400] }} /> }}
              sx={{ "& .MuiFilledInput-root": { backgroundColor: colors.primary[500] } }}
            />
          </Box>

          <Button type="submit" color="secondary" variant="contained" fullWidth disabled={loading} sx={{ mb: 2, py: 1.2 }}>
            {loading ? <CircularProgress size={24} /> : "Login"}
          </Button>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color={colors.grey[300]}>OR</Typography>
          </Divider>

          <Button
            variant="outlined"
            fullWidth
            startIcon={<GoogleIcon />}
            onClick={() => googleLogin()}
            disabled={loading}
            sx={{
              mb: 2,
              py: 1.2,
              borderColor: colors.grey[300],
              color: colors.grey[100],
              "&:hover": {
                borderColor: colors.greenAccent[400],
                backgroundColor: "rgba(76, 206, 172, 0.1)",
              },
            }}
          >
            Sign in with Google
          </Button>

          <Box textAlign="center" mt={2}>
            <Typography variant="body2" color={colors.grey[300]}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: colors.greenAccent[400], textDecoration: "none" }}>
                Register here
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;
