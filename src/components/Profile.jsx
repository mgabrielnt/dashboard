import { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  useTheme,
  Paper,
  Grid,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
} from "@mui/material";
import { tokens } from "../theme";
import Header from "./Header";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import HomeIcon from "@mui/icons-material/Home";
import WorkIcon from "@mui/icons-material/Work";
import BadgeIcon from "@mui/icons-material/Badge";
import InfoIcon from "@mui/icons-material/Info";
import LockIcon from "@mui/icons-material/Lock";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const ProfileTab = ({ value, index, children }) => {
  return (
    <div hidden={value !== index} style={{ padding: "20px 0" }}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const Profile = ({ auth, setAuth }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [tabValue, setTabValue] = useState(0);
  
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    department: "",
    job_title: "",
    bio: "",
    profile_picture: "",
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pictureLoading, setPictureLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});
  const [pictureError, setPictureError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const response = await axios.get(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.profile) {
        setProfileData(response.data.profile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage({
        type: "error",
        text: "Failed to load profile data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
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

  const handleProfilePictureChange = (e) => {
    setPictureError("");
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setPictureError("Please select an image file");
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setPictureError("Image size must be less than 5MB");
        return;
      }
      
      setProfilePicture(file);
    }
  };

  const validateProfileForm = () => {
    const newErrors = {};
    
    if (!profileData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (profileData.phone && !/^[+]?[\d\s()-]{8,15}$/.test(profileData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;
    
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const token = localStorage.getItem("token");
      
      await axios.put(
        `${API_URL}/profile`,
        {
          name: profileData.name,
          phone: profileData.phone,
          address: profileData.address,
          department: profileData.department,
          job_title: profileData.job_title,
          bio: profileData.bio,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Update user name in auth context
      if (auth.user) {
        const updatedUser = { ...auth.user, name: profileData.name };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setAuth({
          ...auth,
          user: updatedUser,
        });
      }
      
      setMessage({
        type: "success",
        text: "Profile updated successfully!",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: "Failed to update profile. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadProfilePicture = async (e) => {
    e.preventDefault();
    if (!profilePicture) return;
    
    setPictureLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("profilePicture", profilePicture);
      
      const response = await axios.post(`${API_URL}/profile/picture`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      
      // Update profile picture in state
      setProfileData((prev) => ({
        ...prev,
        profile_picture: response.data.profilePicture,
      }));
      
      // Update user profile picture in auth context
      if (auth.user) {
        const updatedUser = {
          ...auth.user,
          profile_picture: response.data.profilePicture,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setAuth({
          ...auth,
          user: updatedUser,
        });
      }
      
      setProfilePicture(null);
      setMessage({
        type: "success",
        text: "Profile picture updated successfully!",
      });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update profile picture. Please try again.",
      });
    } finally {
      setPictureLoading(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;
    
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const token = localStorage.getItem("token");
      
      await axios.put(
        `${API_URL}/profile/password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      setMessage({
        type: "success",
        text: "Password updated successfully!",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box m="20px">
      <Header title="PROFILE" subtitle="Manage your account information" />
      
      <Paper
        elevation={3}
        sx={{
          mt: 2,
          p: 3,
          backgroundColor: colors.primary[400],
          borderRadius: "10px",
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={4} textAlign="center">
            <Box position="relative" display="inline-block">
            <Avatar
              src={profileData.profile_picture ? 
                (profileData.profile_picture.startsWith('http') ? 
                  profileData.profile_picture : 
                  `http://localhost:5000${profileData.profile_picture}`) 
                : ""}
              alt={profileData.name}
              sx={{
                width: 150,
                height: 150,
                mx: "auto",
                border: `2px solid ${colors.greenAccent[500]}`,
              }}
            >
              {profileData.name ? profileData.name.charAt(0).toUpperCase() : "U"}
            </Avatar>
              <label htmlFor="profile-picture">
                <input
                  accept="image/*"
                  id="profile-picture"
                  type="file"
                  style={{ display: "none" }}
                  onChange={handleProfilePictureChange}
                />
                <Tooltip title="Upload profile picture">
                  <IconButton
                    color="secondary"
                    aria-label="upload picture"
                    component="span"
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      backgroundColor: colors.primary[300],
                    }}
                  >
                    <PhotoCamera />
                  </IconButton>
                </Tooltip>
              </label>
            </Box>
            
            {pictureError && (
              <Typography variant="body2" color="error" mt={1}>
                {pictureError}
              </Typography>
            )}
            
            {profilePicture && (
              <Box mt={2}>
                <Typography variant="body2" mb={1}>
                  New picture selected: {profilePicture.name}
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={uploadProfilePicture}
                  disabled={pictureLoading}
                >
                  {pictureLoading ? <CircularProgress size={24} /> : "Upload Picture"}
                </Button>
              </Box>
            )}
            
            <Box mt={3}>
              <Typography variant="h4" fontWeight="bold">
                {profileData.name || "User"}
              </Typography>
              <Typography variant="body1" color={colors.grey[300]}>
                {profileData.job_title || "No title specified"}
              </Typography>
              <Typography variant="body2" color={colors.grey[300]}>
                {profileData.email}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  display: "inline-block",
                  px: 2,
                  py: 0.5,
                  borderRadius: "4px",
                  backgroundColor:
                    auth.user?.role === "admin"
                      ? colors.greenAccent[600]
                      : colors.blueAccent[700],
                }}
              >
                {auth.user?.role || "user"}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              textColor="secondary"
              indicatorColor="secondary"
              sx={{
                "& .MuiTab-root": {
                  color: colors.grey[300],
                  "&.Mui-selected": {
                    color: colors.greenAccent[400],
                  },
                },
              }}
            >
              <Tab label="Personal Information" />
              <Tab label="Change Password" />
            </Tabs>
            
            <Divider sx={{ mb: 3 }} />
            
            {message.text && (
              <Alert severity={message.type} sx={{ mb: 3 }}>
                {message.text}
              </Alert>
            )}
            
            <ProfileTab value={tabValue} index={0}>
              <form onSubmit={updateProfile}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      variant="filled"
                      label="Full Name"
                      name="name"
                      value={profileData.name || ""}
                      onChange={handleProfileChange}
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
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      variant="filled"
                      label="Email"
                      name="email"
                      value={profileData.email || ""}
                      disabled
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
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      variant="filled"
                      label="Phone Number"
                      name="phone"
                      value={profileData.phone || ""}
                      onChange={handleProfileChange}
                      error={!!errors.phone}
                      helperText={errors.phone}
                      InputProps={{
                        startAdornment: (
                          <PhoneIcon sx={{ mr: 1, color: colors.greenAccent[400] }} />
                        ),
                      }}
                      sx={{
                        "& .MuiFilledInput-root": {
                          backgroundColor: colors.primary[500],
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      variant="filled"
                      label="Address"
                      name="address"
                      value={profileData.address || ""}
                      onChange={handleProfileChange}
                      InputProps={{
                        startAdornment: (
                          <HomeIcon sx={{ mr: 1, color: colors.greenAccent[400] }} />
                        ),
                      }}
                      sx={{
                        "& .MuiFilledInput-root": {
                          backgroundColor: colors.primary[500],
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      variant="filled"
                      label="Department"
                      name="department"
                      value={profileData.department || ""}
                      onChange={handleProfileChange}
                      InputProps={{
                        startAdornment: (
                          <WorkIcon sx={{ mr: 1, color: colors.greenAccent[400] }} />
                        ),
                      }}
                      sx={{
                        "& .MuiFilledInput-root": {
                          backgroundColor: colors.primary[500],
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      variant="filled"
                      label="Job Title"
                      name="job_title"
                      value={profileData.job_title || ""}
                      onChange={handleProfileChange}
                      InputProps={{
                        startAdornment: (
                          <BadgeIcon sx={{ mr: 1, color: colors.greenAccent[400] }} />
                        ),
                      }}
                      sx={{
                        "& .MuiFilledInput-root": {
                          backgroundColor: colors.primary[500],
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      variant="filled"
                      label="Bio"
                      name="bio"
                      value={profileData.bio || ""}
                      onChange={handleProfileChange}
                      multiline
                      rows={4}
                      InputProps={{
                        startAdornment: (
                          <InfoIcon sx={{ mr: 1, mt: 1, color: colors.greenAccent[400] }} />
                        ),
                      }}
                      sx={{
                        "& .MuiFilledInput-root": {
                          backgroundColor: colors.primary[500],
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      disabled={loading}
                      sx={{ mt: 2 }}
                    >
                      {loading ? <CircularProgress size={24} /> : "Save Changes"}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </ProfileTab>
            
            <ProfileTab value={tabValue} index={1}>
              <form onSubmit={updatePassword}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      variant="filled"
                      type="password"
                      label="Current Password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      error={!!errors.currentPassword}
                      helperText={errors.currentPassword}
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
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      variant="filled"
                      type="password"
                      label="New Password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      error={!!errors.newPassword}
                      helperText={errors.newPassword}
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
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      variant="filled"
                      type="password"
                      label="Confirm New Password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
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
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      disabled={loading}
                      sx={{ mt: 2 }}
                    >
                      {loading ? <CircularProgress size={24} /> : "Update Password"}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </ProfileTab>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Profile;