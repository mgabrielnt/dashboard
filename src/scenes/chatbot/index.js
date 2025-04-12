import { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  useTheme, 
  Card, 
  CardContent, 
  Grid, 
  IconButton, 
  Tooltip,
  Paper,
  Zoom,
  Fade
} from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import Chatbot from "../../components/Chatbot";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SchemaIcon from "@mui/icons-material/Schema";

const ChatbotPage = ({ auth }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [showTip, setShowTip] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [infoVisible, setInfoVisible] = useState(false);

  const chatTips = [
    "Tanyakan: 'Berapa total konsol untuk bulan 1?'",
    "Cobalah: 'Tampilkan data BKI untuk tahun 2024'",
    "Tanyakan: 'Bandingkan total BKI dan SCI per tahun'",
    "Cobalah: 'Berapa nilai tertinggi konsol tahun 2023?'",
    "Tanyakan: 'Tampilkan total liabilitas'",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (showTip) {
        setTipIndex((prev) => (prev + 1) % chatTips.length);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [showTip, chatTips.length]);

  const toggleTips = () => {
    setShowTip((prev) => !prev);
  };

  const toggleInfo = () => {
    setInfoVisible((prev) => !prev);
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="DATABASE ASSISTANT" subtitle="Ajukan pertanyaan tentang data Anda dalam bahasa Indonesia" />
        
        <Box display="flex" gap={1}>
          <Tooltip title="Tampilkan contoh pertanyaan" placement="bottom" arrow>
            <IconButton onClick={toggleTips} sx={{ 
              backgroundColor: showTip ? colors.greenAccent[600] : colors.primary[400],
              borderRadius: "50%",
              "&:hover": { backgroundColor: colors.greenAccent[500] }
            }}>
              <LightbulbOutlinedIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Tampilkan informasi database" placement="bottom" arrow>
            <IconButton onClick={toggleInfo} sx={{ 
              backgroundColor: infoVisible ? colors.blueAccent[600] : colors.primary[400],
              borderRadius: "50%",
              "&:hover": { backgroundColor: colors.blueAccent[500] }
            }}>
              <InfoOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Example questions section */}
      {showTip && (
        <Fade in={showTip} timeout={500}>
          <Paper 
            elevation={3}
            sx={{
              p: 2,
              mb: 2,
              backgroundColor: colors.primary[400],
              borderLeft: `4px solid ${colors.greenAccent[500]}`,
              display: "flex",
              alignItems: "center"
            }}
          >
            <LightbulbOutlinedIcon sx={{ color: colors.greenAccent[500], mr: 2 }} />
            <Typography variant="body1" fontStyle="italic">
              {chatTips[tipIndex]}
            </Typography>
          </Paper>
        </Fade>
      )}

      {/* Database Info Section */}
      {infoVisible && (
        <Zoom in={infoVisible} timeout={300}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ 
                backgroundColor: colors.primary[400], 
                height: "100%",
                transition: "transform 0.3s",
                "&:hover": { transform: "translateY(-5px)" }
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <SchemaIcon sx={{ color: colors.blueAccent[500], mr: 1 }} />
                    <Typography variant="h5" fontWeight="bold">Struktur Database</Typography>
                  </Box>
                  <Typography variant="body2">
                    Tabel utama: <b>split_pivot_all_full_real_test</b>
                  </Typography>
                  <Typography variant="body2" mt={1}>
                    Kolom utama: tahun, bulan, description, bki, sci, si, konsol
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={8}>
              <Card sx={{ 
                backgroundColor: colors.primary[400], 
                height: "100%",
                transition: "transform 0.3s",
                "&:hover": { transform: "translateY(-5px)" }
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <HelpOutlineIcon sx={{ color: colors.greenAccent[500], mr: 1 }} />
                    <Typography variant="h5" fontWeight="bold">Cara Penggunaan</Typography>
                  </Box>
                  <Typography variant="body2">
                    Asisten database memungkinkan Anda mengajukan pertanyaan tentang data keuangan dalam bahasa Indonesia natural.
                  </Typography>
                  <Typography variant="body2" mt={1}>
                    Anda dapat menanyakan tentang nilai BKI, SCI, dan konsol per tahun/bulan, membandingkan nilai, serta mencari nilai tertinggi atau terendah.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Zoom>
      )}

      <Box
        sx={{
          height: "68vh",
          backgroundColor: colors.primary[600],
          borderRadius: "16px",
          boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
          overflow: "hidden",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: "0px 15px 30px rgba(0, 0, 0, 0.3)",
          }
        }}
      >
        <Chatbot auth={auth} />
      </Box>
    </Box>
  );
};

export default ChatbotPage;