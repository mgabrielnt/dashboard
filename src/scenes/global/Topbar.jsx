import { Box, IconButton, useTheme, Popover, Button, Menu, MenuItem } from "@mui/material";
import { useContext, useState } from "react";
import { ColorModeContext, tokens } from "../../theme";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const [open, setOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

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
                    backgroundColor: "rgb(30, 35, 80)", // Warna biru gelap
                    border: "2px solid black", // Garis luar hitam
                    borderRadius: "12px", // Ujung kotak lebih estetik
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
                  backgroundColor: "rgb(30, 35, 80)", // Warna biru gelap
                  border: "2px solid black", // Garis luar hitam
                  borderRadius: "12px", // Ujung kotak lebih estetik
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
        <IconButton>
          <PersonOutlinedIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Topbar;
