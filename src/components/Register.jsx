import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, Button, TextField, Typography, useTheme, Paper, Divider, CircularProgress, Alert } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import GoogleIcon from "@mui/icons-material/Google";
import { tokens } from "../theme";
import Header from "./Header";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const Register = ({ setAuth }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      
      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        
        setAuth({
          isAuthenticated: true,
          user: response.data.user,
        });
        
        navigate("/");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage(
        error.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Google Login/Registration
  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      setLoading(true);
      setErrorMessage("");
      
      try {
        // Get user info from Google
        const userInfo = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${response.access_token}`,
            },
          }
        );
        
        // Send ID token to backend
        const authResponse = await axios.post(`${API_URL}/auth/google-auth`, {
          token: response.access_token,
          googleData: userInfo.data,
        });
        
        if (authResponse.data && authResponse.data.token) {
          localStorage.setItem("token", authResponse.data.token);
          localStorage.setItem("user", JSON.stringify(authResponse.data.user));
          
          setAuth({
            isAuthenticated: true,
            user: authResponse.data.user,
          });
          
          navigate("/");
        }
      } catch (error) {
        console.error("Google login error:", error);
        setErrorMessage(
          "Google login failed. Please try again or use email registration."
        );
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
        <Header title="REGISTER" subtitle="Create a new account" center />

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
              type="text"
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              InputProps={{
                startAdornment: (
                  <PersonIcon sx={{ mr: 1, color: colors.greenAccent[400] }} />
                ),
              }}
              sx={{
                "& .MuiFilledInput-root": {
                  backgroundColor: colors.primary[500],
                },
              }}
            />
          </Box>

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
              InputProps={{
                startAdornment: (
                  <EmailIcon sx={{ mr: 1, color: colors.greenAccent[400] }} />
                ),
              }}
              sx={{
                "& .MuiFilledInput-root": {
                  backgroundColor: colors.primary[500],
                },
              }}
            />
          </Box>

          <Box mb={2}>
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
              InputProps={{
                startAdornment: (
                  <LockIcon sx={{ mr: 1, color: colors.greenAccent[400] }} />
                ),
              }}
              sx={{
                "& .MuiFilledInput-root": {
                  backgroundColor: colors.primary[500],
                },
              }}
            />
          </Box>

          <Box mb={3}>
            <TextField
              fullWidth
              variant="filled"
              type="password"
              label="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                startAdornment: (
                  <LockIcon sx={{ mr: 1, color: colors.greenAccent[400] }} />
                ),
              }}
              sx={{
                "& .MuiFilledInput-root": {
                  backgroundColor: colors.primary[500],
                },
              }}
            />
          </Box>

          <Button
            type="submit"
            color="secondary"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ mb: 2, py: 1.2 }}
          >
            {loading ? <CircularProgress size={24} /> : "Register"}
          </Button>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color={colors.grey[300]}>
              OR
            </Typography>
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
            Sign up with Google
          </Button>

          <Box textAlign="center" mt={2}>
            <Typography variant="body2" color={colors.grey[300]}>
              Already have an account?{" "}
              <Link
                to="/login"
                style={{
                  color: colors.greenAccent[400],
                  textDecoration: "none",
                }}
              >
                Login here
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default Register;