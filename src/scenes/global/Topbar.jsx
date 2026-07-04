import { Box, IconButton, useTheme, Menu, MenuItem, Avatar, Typography, Divider } from "@mui/material";
import { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ColorModeContext, tokens } from "../../theme";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Breadcrumb from "../../components/Breadcrumb";

const API_URL = "http://localhost:5000";

const routeTitles = {
  "/": "Dashboard Keuangan Konsolidasi",
  "/team": "Team Management",
  "/contacts": "PT Superintending Company of Indonesia (SUCOFINDO)",
  "/contacts1": "PT Biro Klasifikasi Indonesia (Persero)",
  "/contacts2": "PT Surveyor Indonesia (Persero)",
  "/invoices": "Invoices",
  "/form": "Form",
  "/chatbot": "Database Assistant",
  "/bar": "Bar Chart",
  "/pie": "Pie Chart",
  "/line": "Line Chart",
  "/faq": "FAQ",
  "/calendar": "Calendar",
  "/geography": "Geography",
  "/profile": "User Profile",
};

const Topbar = ({ auth, onLogout }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState("Dashboard Keuangan Konsolidasi");
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const userMenuOpen = Boolean(userMenuAnchor);
  const user = auth?.user || {};
  const isDashboard = location.pathname === "/";

  useEffect(() => {
    setPageTitle(routeTitles[location.pathname] || "Dashboard Keuangan Konsolidasi");
  }, [location.pathname]);

  const handleUserMenuOpen = (event) => setUserMenuAnchor(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);

  const handleProfileClick = () => {
    handleUserMenuClose();
    navigate("/profile");
  };

  const handleLogout = () => {
    handleUserMenuClose();
    if (onLogout) onLogout();
  };

  const getProfilePictureUrl = (pictureUrl) => {
    if (!pictureUrl) return "";
    if (pictureUrl.startsWith("http")) return pictureUrl;
    return `${API_URL}${pictureUrl}`;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1.5}>
        <Box>
          <Typography
            variant="h4"
            fontWeight="900"
            sx={{
              color: colors.grey[100],
              px: 2,
              py: 1,
              borderRadius: "999px",
              background: "linear-gradient(135deg, rgba(244,196,48,0.16), rgba(103,232,249,0.08))",
              border: "1px solid rgba(255,255,255,0.11)",
              boxShadow: "0 18px 48px rgba(0,0,0,0.22)",
              display: "inline-block",
              maxWidth: { xs: "calc(100vw - 170px)", md: "780px" },
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {pageTitle}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={0.5}>
          <IconButton onClick={colorMode.toggleColorMode}>
            {theme.palette.mode === "dark" ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
          </IconButton>
          <IconButton>
            <NotificationsOutlinedIcon />
          </IconButton>
          <IconButton>
            <SettingsOutlinedIcon />
          </IconButton>
          <IconButton onClick={handleUserMenuOpen}>
            {user?.profile_picture ? (
              <Avatar
                src={getProfilePictureUrl(user.profile_picture)}
                sx={{ width: 28, height: 28, backgroundColor: user?.role === "admin" ? colors.blueAccent[700] : colors.blueAccent[500] }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </Avatar>
            ) : (
              <PersonOutlinedIcon />
            )}
          </IconButton>

          <Menu
            anchorEl={userMenuAnchor}
            open={userMenuOpen}
            onClose={handleUserMenuClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: "visible",
                mt: 1.5,
                backgroundColor: colors.primary[400],
                color: colors.grey[100],
                minWidth: 230,
                "& .MuiAvatar-root": { width: 32, height: 32, ml: -0.5, mr: 1 },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <Box px={2} py={1.2}>
              <Typography variant="subtitle1" fontWeight="900">{user?.name || "User"}</Typography>
              <Typography variant="body2" color={colors.grey[300]}>{user?.email || ""}</Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "inline-block",
                  px: 1.2,
                  py: 0.4,
                  mt: 0.8,
                  borderRadius: "999px",
                  background: user?.role === "admin" ? "rgba(244,196,48,0.18)" : "rgba(103,232,249,0.14)",
                  color: colors.grey[100],
                  fontWeight: 800,
                }}
              >
                {user?.role || "user"}
              </Typography>
            </Box>
            <Divider sx={{ borderColor: colors.grey[700] }} />
            <MenuItem onClick={handleProfileClick} sx={{ color: colors.grey[100] }}>
              <AccountCircleIcon sx={{ mr: 1, color: colors.blueAccent[700] }} /> Profile
            </MenuItem>
            <MenuItem onClick={handleUserMenuClose} sx={{ color: colors.grey[100] }}>
              <HelpOutlineIcon sx={{ mr: 1, color: colors.blueAccent[400] }} /> Help
            </MenuItem>
            <Divider sx={{ borderColor: colors.grey[700] }} />
            <MenuItem onClick={handleLogout} sx={{ color: colors.grey[100] }}>
              <LogoutIcon sx={{ mr: 1, color: colors.redAccent[400] }} /> Logout
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {!isDashboard && (
        <Box px={2}>
          <Breadcrumb />
        </Box>
      )}
    </Box>
  );
};

export default Topbar;
