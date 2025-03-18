import { Box, IconButton, useTheme, Popover, Button, Menu, MenuItem, Avatar, Typography, Divider } from "@mui/material";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ColorModeContext, tokens } from "../../theme";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const API_URL = "http://localhost:5000"; // Add this line to define the backend URL

const Topbar = ({ setIsSidebar, auth, onLogout }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();
  
  // Main menu popup
  const [open, setOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // User profile menu
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const userMenuOpen = Boolean(userMenuAnchor);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleMenuOpen = (event, index) => {
    setSelectedIndex(index);
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedIndex(null);
  };

  const menuOpen = Boolean(menuAnchor);

  // User menu handlers
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  const handleProfileClick = () => {
    handleUserMenuClose();
    navigate("/profile");
  };
  
  const handleLogout = () => {
    handleUserMenuClose();
    if (onLogout) {
      onLogout();
    }
  };

  // Make sure auth and user are defined
  const user = auth?.user || {};

  // Function to get the correct profile picture URL
  const getProfilePictureUrl = (pictureUrl) => {
    if (!pictureUrl) return "";
    if (pictureUrl.startsWith("http")) return pictureUrl;
    return `${API_URL}${pictureUrl}`;
  };

  return (
    <Box display="flex" justifyContent="space-between" p={2}>
      {/* CUSTOM DROPDOWN GRID */}
      <Box>
        <Button 
          variant="contained" 
          onClick={handleClick} 
          sx={{ 
            backgroundColor: "rgb(62, 67, 150)", 
            '&:hover': { backgroundColor: "rgb(52, 57, 140)" },
            fontSize: "0.875rem",
            padding: "8px 16px",
            minWidth: "140px"
          }}
        >
          Open Menu
        </Button>
        <Popover
          open={open}
          onClose={handleClose}
          anchorReference="none"
          sx={{
            position: "fixed",
            top: "1%",
            left: "60%",
            transform: "translateX(-50%)",
            '& .MuiPaper-root': {
              backgroundColor: "rgb(62, 67, 150)",
              minWidth: "500px",
              minHeight: "250px",
              padding: "16px"
            }
          }}
        >
          <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
            {[...Array(4)].map((_, index) => (
              <Box key={index} textAlign="center">
                <Box sx={{ color: "white", mb: 1, fontSize: "1.1rem", fontWeight: "bold" }}>
                  Option {index + 1}
                </Box>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  onClick={(e) => handleMenuOpen(e, index)}
                  sx={{ 
                    color: "white", 
                    backgroundColor: "rgb(30, 35, 80)", 
                    border: "2px solid black", 
                    borderRadius: "12px", 
                    fontSize: "1rem",
                    padding: "10px",
                    '&:hover': { backgroundColor: "rgba(255, 255, 255, 0.2)" } 
                  }}
                >
                  Option {index + 1}
                </Button>
                {selectedIndex === index && (
                  <Menu
                    anchorEl={menuAnchor}
                    open={menuOpen}
                    onClose={handleMenuClose}
                    sx={{
                      '& .MuiPaper-root': {
                        backgroundColor: "rgb(62, 67, 150)",
                        color: "white"
                      }
                    }}
                  >
                    <MenuItem onClick={handleMenuClose} sx={{ color: "white" }}>Sub Option 1</MenuItem>
                    <MenuItem onClick={handleMenuClose} sx={{ color: "white" }}>Sub Option 2</MenuItem>
                    <MenuItem onClick={handleMenuClose} sx={{ color: "white" }}>Sub Option 3</MenuItem>
                  </Menu>
                )}
              </Box>
            ))}
            {/* Option 5 di bawah, membentang sepanjang 2 kolom */}
            <Box gridColumn="span 2" textAlign="center">
              <Box sx={{ color: "white", mb: 1, fontSize: "1.1rem", fontWeight: "bold" }}>
                Option 5
              </Box>
              <Button 
                variant="outlined" 
                fullWidth 
                onClick={(e) => handleMenuOpen(e, 4)}
                sx={{ 
                  color: "white", 
                  backgroundColor: "rgb(30, 35, 80)", 
                  border: "2px solid black", 
                  borderRadius: "12px", 
                  fontSize: "1rem",
                  padding: "12px",
                  '&:hover': { backgroundColor: "rgba(255, 255, 255, 0.2)" } 
                }}
              >
                Option 5
              </Button>
              {selectedIndex === 4 && (
                <Menu
                  anchorEl={menuAnchor}
                  open={menuOpen}
                  onClose={handleMenuClose}
                  sx={{
                    '& .MuiPaper-root': {
                      backgroundColor: "rgb(62, 67, 150)",
                      color: "white"
                    }
                  }}
                >
                  <MenuItem onClick={handleMenuClose} sx={{ color: "white" }}>Sub Option 1</MenuItem>
                  <MenuItem onClick={handleMenuClose} sx={{ color: "white" }}>Sub Option 2</MenuItem>
                  <MenuItem onClick={handleMenuClose} sx={{ color: "white" }}>Sub Option 3</MenuItem>
                </Menu>
              )}
            </Box>
          </Box>
        </Popover>
      </Box>

      {/* ICONS */}
      <Box display="flex">
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </IconButton>
        <IconButton>
          <NotificationsOutlinedIcon />
        </IconButton>
        <IconButton>
          <SettingsOutlinedIcon />
        </IconButton>
        
        {/* USER PROFILE BUTTON & MENU */}
        <IconButton onClick={handleUserMenuOpen}>
          {user?.profile_picture ? (
            <Avatar 
              src={getProfilePictureUrl(user.profile_picture)} 
              sx={{ 
                width: 24, 
                height: 24,
                backgroundColor: user?.role === "admin" ? colors.greenAccent[600] : colors.blueAccent[500]
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </Avatar>
          ) : (
            <PersonOutlinedIcon />
          )}
        </IconButton>
        
        {/* USER PROFILE DROPDOWN MENU */}
        <Menu
          anchorEl={userMenuAnchor}
          open={userMenuOpen}
          onClose={handleUserMenuClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box px={2} py={1}>
            <Typography variant="subtitle1" fontWeight="bold">
              {user?.name || "User"}
            </Typography>
            <Typography variant="body2" color={colors.grey[300]}>
              {user?.email || ""}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: "inline-block",
                px: 1,
                py: 0.5,
                mt: 0.5,
                borderRadius: "4px",
                backgroundColor: user?.role === "admin" ? colors.greenAccent[600] : colors.blueAccent[700],
              }}
            >
              {user?.role || "user"}
            </Typography>
          </Box>
          
          <Divider sx={{ borderColor: colors.grey[700] }} />
          
          <MenuItem onClick={handleProfileClick} sx={{ color: colors.grey[100] }}>
            <AccountCircleIcon sx={{ mr: 1, color: colors.greenAccent[400] }} /> Profile
          </MenuItem>
          
          <MenuItem onClick={handleUserMenuClose} sx={{ color: colors.grey[100] }}>
            <HelpOutlineIcon sx={{ mr: 1, color: colors.greenAccent[400] }} /> Help
          </MenuItem>
          
          <Divider sx={{ borderColor: colors.grey[700] }} />
          
          <MenuItem onClick={handleLogout} sx={{ color: colors.grey[100] }}>
            <LogoutIcon sx={{ mr: 1, color: colors.redAccent[400] }} /> Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Topbar;