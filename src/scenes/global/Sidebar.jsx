import { useState } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme, Avatar } from "@mui/material";
import { Link } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";
import { tokens } from "../../theme";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";

const API_URL = "http://localhost:5000";

const getProfilePictureUrl = (pictureUrl) => {
  if (!pictureUrl) return "";
  if (pictureUrl.startsWith("http")) return pictureUrl;
  return `${API_URL}${pictureUrl}`;
};

const Item = ({ title, subtitle, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <MenuItem
      active={selected === title}
      style={{ color: colors.grey[100] }}
      onClick={() => setSelected(title)}
      icon={icon}
    >
      <Box>
        <Typography fontWeight={800} fontSize="0.84rem" lineHeight={1.15}>{title}</Typography>
        {subtitle && (
          <Typography fontSize="0.66rem" color={colors.grey[400]} lineHeight={1.15} mt="2px">
            {subtitle}
          </Typography>
        )}
      </Box>
      <Link to={to} />
    </MenuItem>
  );
};

const Sidebar = ({ isSidebar, auth }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [selected, setSelected] = useState("Dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const user = auth?.user || {};
  const isAdmin = user?.role === "admin";

  return (
    <Box
      sx={{
        "& .pro-sidebar-inner": { background: `${colors.primary[400]} !important` },
        "& .pro-icon-wrapper": { backgroundColor: "transparent !important" },
        "& .pro-inner-item": { padding: "8px 26px 8px 18px !important" },
        "& .pro-inner-item:hover": { color: `${colors.blueAccent[700]} !important` },
        "& .pro-menu-item.active": { color: `${colors.blueAccent[700]} !important` },
        display: isSidebar ? "block" : "none",
      }}
    >
      <ProSidebar collapsed={isCollapsed}>
        <Menu iconShape="square">
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{ margin: "10px 0 20px 0", color: colors.grey[100] }}
          >
            {!isCollapsed && (
              <Box display="flex" justifyContent="space-between" alignItems="center" ml="15px">
                <Box>
                  <Typography variant="h4" color={colors.grey[100]} fontWeight="900">
                    FINANCE
                  </Typography>
                  <Typography variant="caption" color={colors.grey[400]} fontWeight="800">
                    BKI • SUCOFINDO • Surveyor Indonesia
                  </Typography>
                </Box>
                <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                  <MenuOutlinedIcon />
                </IconButton>
              </Box>
            )}
          </MenuItem>

          {!isCollapsed && user && (
            <Box mb="24px">
              <Box display="flex" justifyContent="center" alignItems="center">
                <Avatar
                  alt={user.name || "User"}
                  src={getProfilePictureUrl(user.profile_picture)}
                  sx={{ width: 86, height: 86, border: `2px solid ${colors.blueAccent[700]}`, boxShadow: "0 0 34px rgba(244,196,48,0.18)" }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </Avatar>
              </Box>
              <Box textAlign="center" px={1}>
                <Typography variant="h4" color={colors.grey[100]} fontWeight="900" sx={{ m: "10px 0 0 0" }}>
                  {user.name || "User"}
                </Typography>
                <Typography variant="h6" color={colors.blueAccent[700]} fontWeight="800">
                  {isAdmin ? "Administrator" : "User"}
                </Typography>
              </Box>
            </Box>
          )}

          <Box paddingLeft={isCollapsed ? undefined : "6%"}>
            <Item title="Dashboard" subtitle="Konsolidasi Keuangan" to="/" icon={<HomeOutlinedIcon />} selected={selected} setSelected={setSelected} />

            <Typography variant="h6" color={colors.grey[300]} sx={{ m: "16px 0 8px 20px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Data Entitas
            </Typography>
            
            {isAdmin && (
              <Item title="Manage Team" subtitle="Admin users" to="/team" icon={<PeopleOutlinedIcon />} selected={selected} setSelected={setSelected} />
            )}
            
            <Item title="SUCOFINDO" subtitle="PT Superintending Company of Indonesia" to="/contacts" icon={<ContactsOutlinedIcon />} selected={selected} setSelected={setSelected} />
            <Item title="BKI" subtitle="PT Biro Klasifikasi Indonesia (Persero)" to="/contacts1" icon={<ContactsOutlinedIcon />} selected={selected} setSelected={setSelected} />
            <Item title="SI" subtitle="PT Surveyor Indonesia (Persero)" to="/contacts2" icon={<ContactsOutlinedIcon />} selected={selected} setSelected={setSelected} />
            <Item title="Invoices Balances" to="/invoices" icon={<ReceiptOutlinedIcon />} selected={selected} setSelected={setSelected} />

            <Typography variant="h6" color={colors.grey[300]} sx={{ m: "16px 0 8px 20px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Pages
            </Typography>
            <Item title="Profile" to="/profile" icon={<PersonOutlinedIcon />} selected={selected} setSelected={setSelected} />
            <Item title="Calendar" to="/calendar" icon={<CalendarTodayOutlinedIcon />} selected={selected} setSelected={setSelected} />
            <Item title="Database Assistant" to="/chatbot" icon={<SmartToyOutlinedIcon />} selected={selected} setSelected={setSelected} />
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;
