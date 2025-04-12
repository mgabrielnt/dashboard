import { useState, useEffect, useRef } from "react";
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
  Zoom,
  Fade,
  Card,
  CardContent,
  Snackbar,
  Slide,
  Grow,
  Switch,
  FormControlLabel,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  Badge,
  Backdrop,
} from "@mui/material";
import { tokens } from "../theme";
import {
  PhotoCamera,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  Badge as BadgeIcon,
  Info as InfoIcon,
  Lock as LockIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ColorLens as ColorLensIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  MoreVert as MoreVertIcon,
  Notifications as NotificationsIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Avatar editor with previews
const AvatarEditor = ({ profilePicture, onUpload, onCancel, colors }) => {
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  
  if (!profilePicture) return null;
  
  const imageUrl = URL.createObjectURL(profilePicture);
  
  return (
    <Zoom in={!!profilePicture}>
      <Card sx={{ mt: 2, backgroundColor: colors.primary[300], position: 'relative' }}>
        <CloudUploadIcon 
          sx={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            fontSize: 40, 
            opacity: 0.2,
            color: colors.greenAccent[400]
          }} 
        />
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Preview New Profile Picture
          </Typography>
          <Box display="flex" flexDirection="column" alignItems="center">
            <Box 
              sx={{ 
                width: 200, 
                height: 200, 
                borderRadius: '50%', 
                overflow: 'hidden',
                border: `3px solid ${colors.greenAccent[500]}`,
                boxShadow: `0 0 15px ${colors.greenAccent[500]}`,
                transition: 'all 0.3s ease',
                position: 'relative',
                '&:hover': {
                  transform: 'scale(1.05)',
                }
              }}
            >
              <Box 
                sx={{ 
                  width: '100%', 
                  height: '100%', 
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transform: `scale(${zoom}) translate(${previewPosition.x}px, ${previewPosition.y}px)`,
                  transition: 'transform 0.3s ease',
                }}
              />
            </Box>
            
            <Typography variant="body2" mt={2} mb={1}>
              Zoom: {Math.round(zoom * 100)}%
            </Typography>
            <Box width="80%" mb={2}>
              <input
                type="range"
                min="1"
                max="2"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </Box>
            
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                color="secondary"
                onClick={onUpload}
                startIcon={<SaveIcon />}
                sx={{ 
                  borderRadius: '20px',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 5px 15px ${colors.greenAccent[500]}40`,
                  }
                }}
              >
                Upload
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={onCancel}
                startIcon={<CancelIcon />}
                sx={{ 
                  borderRadius: '20px',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Zoom>
  );
};

// Profile tab component for conditional rendering
const ProfileTab = ({ value, index, children }) => (
  <Fade in={value === index} timeout={500}>
    <div hidden={value !== index} style={{ padding: "20px 0" }}>
      {value === index && <Box>{children}</Box>}
    </div>
  </Fade>
);

const Profile = ({ auth, setAuth }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [tabValue, setTabValue] = useState(0);
  const fileInputRef = useRef(null);
  
  // State variables
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
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [editMode, setEditMode] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [backdropOpen, setBackdropOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // API functions
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
      showSnackbar("Failed to load profile data", "error");
    } finally {
      setLoading(false);
    }
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
      
      setEditMode(false);
      showSnackbar("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      showSnackbar("Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const uploadProfilePicture = async () => {
    if (!profilePicture) return;
    
    setPictureLoading(true);
    setBackdropOpen(true);
    
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
      showSnackbar("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error updating profile picture:", error);
      showSnackbar(error.response?.data?.message || "Failed to update profile picture", "error");
    } finally {
      setPictureLoading(false);
      setBackdropOpen(false);
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
      
      showSnackbar("Password updated successfully!");
    } catch (error) {
      console.error("Error updating password:", error);
      showSnackbar(error.response?.data?.message || "Failed to update password", "error");
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
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

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const toggleEditMode = () => {
    setEditMode((prev) => !prev);
  };

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleRefresh = () => {
    fetchProfile();
    handleMenuClose();
    showSnackbar("Profile refreshed");
  };

  const cancelEdit = () => {
    fetchProfile();
    setEditMode(false);
    showSnackbar("Changes discarded");
  };

  const cancelPictureUpload = () => {
    setProfilePicture(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const closeSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Form validation
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

  // Helper functions
  const getProfilePictureUrl = () => {
    if (!profileData.profile_picture) return "";
    
    return profileData.profile_picture.startsWith('http') 
      ? profileData.profile_picture 
      : `http://localhost:5000${profileData.profile_picture}`;
  };

  // UI Components
  const renderProfilePicture = () => (
    <Box 
      position="relative" 
      display="inline-block"
      sx={{
        transition: 'transform 0.3s ease',
        '&:hover': {
          transform: 'scale(1.05)',
        }
      }}
    >
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <Tooltip title="Upload profile picture" arrow>
            <IconButton
              color="secondary"
              aria-label="upload picture"
              component="label"
              onClick={() => fileInputRef.current?.click()}
              sx={{
                backgroundColor: colors.primary[300],
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: colors.greenAccent[600],
                  transform: 'scale(1.1)',
                }
              }}
            >
              <PhotoCamera />
            </IconButton>
          </Tooltip>
        }
      >
        <Avatar
          src={getProfilePictureUrl()}
          alt={profileData.name}
          sx={{
            width: 150,
            height: 150,
            mx: "auto",
            border: `3px solid ${colors.greenAccent[500]}`,
            boxShadow: `0 0 10px ${colors.greenAccent[500]}80`,
            transition: 'all 0.3s ease',
          }}
        >
          {profileData.name ? profileData.name.charAt(0).toUpperCase() : "U"}
        </Avatar>
      </Badge>
      <input
        ref={fileInputRef}
        accept="image/*"
        id="profile-picture"
        type="file"
        style={{ display: "none" }}
        onChange={handleProfilePictureChange}
      />
    </Box>
  );

  const renderUserInfo = () => (
    <Grow in={true} timeout={800}>
      <Box mt={3}>
        <Typography 
          variant="h3" 
          fontWeight="bold"
          sx={{
            background: `linear-gradient(90deg, ${colors.greenAccent[500]}, ${colors.blueAccent[400]})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          {profileData.name || "User"}
        </Typography>
        
        <Chip
          icon={<BadgeIcon />}
          label={profileData.job_title || "No title specified"}
          variant="outlined"
          color="secondary"
          sx={{ mb: 1 }}
        />
        
        <Typography variant="body2" color={colors.grey[300]} sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
          <EmailIcon fontSize="small" color="secondary" />
          {profileData.email}
        </Typography>
        
        <Zoom in={true} timeout={1000}>
          <Chip
            label={auth.user?.role || "user"}
            color={auth.user?.role === "admin" ? "success" : "primary"}
            sx={{ mt: 2 }}
          />
        </Zoom>
      </Box>
    </Grow>
  );

  const renderPersonalInfoForm = () => (
    <form onSubmit={updateProfile}>
      <Grid container spacing={2}>
        <Grid item xs={12} mb={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" fontWeight="bold" color={colors.greenAccent[400]}>
              {editMode ? "Edit Your Information" : "Personal Information"}
            </Typography>
            <Tooltip title={editMode ? "Save changes" : "Edit profile"}>
              <IconButton 
                color="secondary" 
                onClick={toggleEditMode}
                type="button"
                sx={{
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.1)'
                  }
                }}
              >
                {editMode ? <SaveIcon /> : <EditIcon />}
              </IconButton>
            </Tooltip>
            
            {editMode && (
              <Tooltip title="Cancel editing">
                <IconButton 
                  color="error" 
                  onClick={cancelEdit}
                  sx={{
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <CancelIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Grid>
        
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
            disabled={!editMode}
            InputProps={{
              startAdornment: (
                <PersonIcon sx={{ mr: 1, color: colors.greenAccent[400] }} />
              ),
            }}
            sx={{
              "& .MuiFilledInput-root": {
                backgroundColor: colors.primary[500],
                transition: 'all 0.3s',
                '&:hover': {
                  backgroundColor: editMode ? colors.primary[400] : colors.primary[500]
                }
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
            disabled={!editMode}
            InputProps={{
              startAdornment: (
                <PhoneIcon sx={{ mr: 1, color: colors.greenAccent[400] }} />
              ),
            }}
            sx={{
              "& .MuiFilledInput-root": {
                backgroundColor: colors.primary[500],
                transition: 'all 0.3s',
                '&:hover': {
                  backgroundColor: editMode ? colors.primary[400] : colors.primary[500]
                }
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
            disabled={!editMode}
            InputProps={{
              startAdornment: (
                <HomeIcon sx={{ mr: 1, color: colors.greenAccent[400] }} />
              ),
            }}
            sx={{
              "& .MuiFilledInput-root": {
                backgroundColor: colors.primary[500],
                transition: 'all 0.3s',
                '&:hover': {
                  backgroundColor: editMode ? colors.primary[400] : colors.primary[500]
                }
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
            disabled={!editMode}
            InputProps={{
              startAdornment: (
                <WorkIcon sx={{ mr: 1, color: colors.greenAccent[400] }} />
              ),
            }}
            sx={{
              "& .MuiFilledInput-root": {
                backgroundColor: colors.primary[500],
                transition: 'all 0.3s',
                '&:hover': {
                  backgroundColor: editMode ? colors.primary[400] : colors.primary[500]
                }
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
            disabled={!editMode}
            InputProps={{
              startAdornment: (
                <BadgeIcon sx={{ mr: 1, color: colors.greenAccent[400] }} />
              ),
            }}
            sx={{
              "& .MuiFilledInput-root": {
                backgroundColor: colors.primary[500],
                transition: 'all 0.3s',
                '&:hover': {
                  backgroundColor: editMode ? colors.primary[400] : colors.primary[500]
                }
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
            disabled={!editMode}
            InputProps={{
              startAdornment: (
                <InfoIcon sx={{ mr: 1, mt: 1, color: colors.greenAccent[400] }} />
              ),
            }}
            sx={{
              "& .MuiFilledInput-root": {
                backgroundColor: colors.primary[500],
                transition: 'all 0.3s',
                '&:hover': {
                  backgroundColor: editMode ? colors.primary[400] : colors.primary[500]
                }
              },
            }}
          />
        </Grid>
        
        {editMode && (
          <Grid item xs={12}>
            <Box display="flex" gap={2} mt={2}>
              <Button
                type="submit"
                variant="contained"
                color="secondary"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                sx={{ 
                  borderRadius: '20px',
                  px: 3,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 5px 15px ${colors.greenAccent[500]}40`,
                  }
                }}
              >
                Save Changes
              </Button>
              
              <Button
                variant="outlined"
                color="error"
                onClick={cancelEdit}
                startIcon={<CancelIcon />}
                sx={{ 
                  borderRadius: '20px',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                Cancel
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>
    </form>
  );

  const renderPasswordForm = () => (
    <form onSubmit={updatePassword}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h5" fontWeight="bold" color={colors.greenAccent[400]} mb={2}>
            Change Your Password
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            variant="filled"
            type={showPassword.currentPassword ? "text" : "password"}
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
              endAdornment: (
                <IconButton
                  onClick={() => togglePasswordVisibility("currentPassword")}
                  edge="end"
                >
                  {showPassword.currentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              ),
            }}
            sx={{
              "& .MuiFilledInput-root": {
                backgroundColor: colors.primary[500],
                transition: 'all 0.3s',
                '&:hover': {
                  backgroundColor: colors.primary[400]
                }
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            variant="filled"
            type={showPassword.newPassword ? "text" : "password"}
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
              endAdornment: (
                <IconButton
                  onClick={() => togglePasswordVisibility("newPassword")}
                  edge="end"
                >
                  {showPassword.newPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              ),
            }}
            sx={{
              "& .MuiFilledInput-root": {
                backgroundColor: colors.primary[500],
                transition: 'all 0.3s',
                '&:hover': {
                  backgroundColor: colors.primary[400]
                }
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            variant="filled"
            type={showPassword.confirmPassword ? "text" : "password"}
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
              endAdornment: (
                <IconButton
                  onClick={() => togglePasswordVisibility("confirmPassword")}
                  edge="end"
                >
                  {showPassword.confirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              ),
            }}
            sx={{
              "& .MuiFilledInput-root": {
                backgroundColor: colors.primary[500],
                transition: 'all 0.3s',
                '&:hover': {
                  backgroundColor: colors.primary[400]
                }
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Box mt={2}>
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <LockIcon />}
              sx={{ 
                borderRadius: '20px',
                px: 3,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 5px 15px ${colors.greenAccent[500]}40`,
                }
              }}
            >
              Update Password
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );

  // Main render
  return (
    <Box m="20px">
      {/* Options menu */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Tooltip title="Profile options">
          <IconButton
            onClick={handleMenuOpen}
            sx={{
              backgroundColor: colors.primary[400],
              '&:hover': {
                backgroundColor: colors.primary[300],
              }
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              backgroundColor: colors.primary[400],
              borderRadius: '10px',
              boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
            }
          }}
        >
          <MenuItem onClick={handleRefresh}>
            <ListItemIcon>
              <RefreshIcon fontSize="small" color="secondary" />
            </ListItemIcon>
            Refresh Profile
          </MenuItem>
          <MenuItem onClick={() => {
            handleMenuClose();
            toggleEditMode();
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" color="secondary" />
            </ListItemIcon>
            {editMode ? "Cancel Editing" : "Edit Profile"}
          </MenuItem>
          <MenuItem onClick={() => {
            handleMenuClose();
            fileInputRef.current?.click();
          }}>
            <ListItemIcon>
              <PhotoCamera fontSize="small" color="secondary" />
            </ListItemIcon>
            Change Avatar
          </MenuItem>
        </Menu>
      </Box>

      <Paper
        elevation={6}
        sx={{
          mt: 2,
          p: 3,
          backgroundColor: colors.primary[400],
          borderRadius: "20px",
          boxShadow: `0 10px 30px rgba(0,0,0,0.15)`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Background decorative elements */}
        <Box 
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.greenAccent[500]}30 0%, transparent 70%)`,
            zIndex: 0,
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            bottom: -50,
            left: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.blueAccent[500]}20 0%, transparent 70%)`,
            zIndex: 0,
          }}
        />

        <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
          {/* Left column - Profile Picture & Basic Info */}
          <Grid item xs={12} md={4} textAlign="center">
            {renderProfilePicture()}
            
            {pictureError && (
              <Typography variant="body2" color="error" mt={1}>
                {pictureError}
              </Typography>
            )}
            
            {/* Avatar Editor */}
            <AvatarEditor 
              profilePicture={profilePicture}
              onUpload={uploadProfilePicture}
              onCancel={cancelPictureUpload}
              colors={colors}
            />
            
            {renderUserInfo()}
          </Grid>
          
          {/* Right column - Forms */}
          <Grid item xs={12} md={8}>
            <Box 
              sx={{
                backgroundColor: colors.primary[500],
                borderRadius: '10px',
                mb: 2,
                overflow: 'hidden',
              }}
            >
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                textColor="secondary"
                indicatorColor="secondary"
                sx={{
                  "& .MuiTab-root": {
                    color: colors.grey[300],
                    py: 2,
                    transition: 'all 0.3s',
                    "&.Mui-selected": {
                      color: colors.greenAccent[400],
                      fontWeight: 'bold',
                    },
                    "&:hover": {
                      backgroundColor: colors.primary[600],
                    }
                  },
                }}
              >
                <Tab 
                  label="Personal Information" 
                  icon={<PersonIcon />} 
                  iconPosition="start"
                />
                <Tab 
                  label="Security" 
                  icon={<LockIcon />} 
                  iconPosition="start"
                />
              </Tabs>
            </Box>
            
            {message.text && (
              <Alert 
                severity={message.type} 
                sx={{ 
                  mb: 3,
                  borderRadius: '10px',
                  animation: 'fadeIn 0.5s ease-in-out'
                }}
              >
                {message.text}
              </Alert>
            )}
            
            <Paper
              elevation={2}
              sx={{
                backgroundColor: colors.primary[500],
                p: 3,
                borderRadius: '15px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: `0 8px 25px rgba(0,0,0,0.2)`,
                },
              }}
            >
              <ProfileTab value={tabValue} index={0}>
                {renderPersonalInfoForm()}
              </ProfileTab>
              
              <ProfileTab value={tabValue} index={1}>
                {renderPasswordForm()}
              </ProfileTab>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Backdrop for loading */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(3px)'
        }}
        open={backdropOpen}
      >
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center"
          p={4}
          borderRadius="10px"
          sx={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <CircularProgress color="secondary" size={60} />
          <Typography variant="h6" mt={2}>
            Updating profile...
          </Typography>
        </Box>
      </Backdrop>

      {/* Snackbar notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={closeSnackbar}
        TransitionComponent={Slide}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={closeSnackbar} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}
          icon={snackbar.severity === 'success' ? <CheckIcon /> : undefined}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;