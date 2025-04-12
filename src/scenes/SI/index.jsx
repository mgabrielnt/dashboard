// src/scenes/SI/index.jsx
import { useState, useEffect } from "react";
import { 
  Box, Button, Grid, useTheme, Paper, 
  Typography, Card, CardContent, Tooltip, 
  IconButton, LinearProgress, Chip, Avatar,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import axios from "axios";
// Import file-saver directly
import { saveAs } from 'file-saver';
// Import XLSX directly
import * as XLSX from 'xlsx';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  MonetizationOn as MoneyIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  CalendarMonth as CalendarIcon,
  FilterAlt as FilterIcon,
  InsertChart as ChartIcon
} from "@mui/icons-material";

const FinancialStatements = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    uniqueYears: 0,
    uniqueEntities: 0,
    totalValue: 0
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  // Calculate statistics from data
  const calculateStats = (data) => {
    if (!data || data.length === 0) return;
    
    const years = new Set(data.map(item => item.year).filter(year => year !== "N/A"));
    const entities = new Set(data.map(item => item.entitas).filter(e => e !== "N/A"));
    
    let totalValue = 0;
    data.forEach(item => {
      const value = parseFloat(item.value);
      if (!isNaN(value)) {
        totalValue += value;
      }
    });
    
    setStats({
      total: data.length,
      uniqueYears: years.size,
      uniqueEntities: entities.size,
      totalValue: totalValue.toLocaleString('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      })
    });
  };

  // Function to show dialog messages
  const showDialog = (type, message) => {
    setDialogType(type);
    setDialogMessage(message);
    setDialogOpen(true);
  };

  // Function to close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Function to export data to Excel
  const handleExportToExcel = () => {
    try {
      if (data.length === 0) {
        showDialog("warning", "Tidak ada data untuk diekspor. Silakan tampilkan data terlebih dahulu.");
        return;
      }

      // Create a clean data set for export, removing "N/A" values
      const exportData = data.map(item => {
        const cleanItem = {};
        Object.keys(item).forEach(key => {
          cleanItem[key] = item[key] === "N/A" ? "" : item[key];
        });
        return cleanItem;
      });

      // Use pre-imported XLSX and file-saver
      // Convert data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const columnWidths = [
        { wch: 10 }, // ID
        { wch: 30 }, // Connect Topic
        { wch: 15 }, // Connect Partition
        { wch: 15 }, // Connect Offset
        { wch: 15 }, // COA
        { wch: 15 }, // Value
        { wch: 15 }, // Entitas
        { wch: 10 }, // Year
        { wch: 15 }, // Posting Period
        { wch: 15 }, // Data Date
        { wch: 25 }, // Timestamp
      ];
      worksheet['!cols'] = columnWidths;
      
      // Create workbook and add worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Keuangan");
      
      // Generate Excel binary
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      // Create Blob and save file
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Generate file name with timestamp
      const fileName = `Laporan_Keuangan_SI_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Save file using saveAs from file-saver
      saveAs(blob, fileName);
      
      showDialog("success", `Data berhasil diekspor ke file ${fileName}`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      showDialog("error", "Terjadi kesalahan saat mengekspor data. Silakan coba lagi.");
    }
  };

  // Fetch data with no filters
  const fetchData = () => {
    setLoading(true);
    
    axios
      .get("http://localhost:5000/api/si")
      .then(response => {
        console.log("API response:", response.data);
        const formattedData = response.data.map((item, index) => ({
          id: item.id || index,
          __connect_topic: item.__connect_topic || "N/A",
          __connect_partition: item.__connect_partition || "N/A",
          __connect_offset: item.__connect_offset || "N/A",
          coa: item.coa || "N/A",
          value: item.value || "N/A",
          entitas: item.entitas || "N/A",
          year: item.year || "N/A",
          posting_period: item.posting_period || "N/A",
          data_date: item.data_date || "N/A",
          timestamp: item.timestamp || "N/A",
        }));
        
        setData(formattedData);
        calculateStats(formattedData);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching financial statements:", error);
        setLoading(false);
        if (error.response && error.response.status === 500) {
          showDialog("error", "Terjadi kesalahan pada server. Harap periksa koneksi ke database atau hubungi administrator.");
        } else {
          showDialog("error", "Terjadi kesalahan saat mengambil data. Silakan coba lagi.");
        }
      });
  };

  // Initial data load
  useEffect(() => {
    fetchData();
  }, []);

  // Enhanced columns with better styling
  const columns = [
    { 
      field: "id", 
      headerName: "ID", 
      flex: 0.5,
      headerAlign: "center",
      align: "center"
    },
    { 
      field: "coa", 
      headerName: "COA", 
      flex: 1,
      renderCell: (params) => (
        <Chip 
          variant="outlined"
          label={params.value}
          size="small"
          sx={{ 
            borderColor: colors.greenAccent[400],
            color: colors.grey[100],
            fontWeight: "bold"
          }}
        />
      )
    },
    { 
      field: "value", 
      headerName: "Value", 
      flex: 1,
      renderCell: (params) => {
        const value = parseFloat(params.value);
        const isNegative = !isNaN(value) && value < 0;
        
        return (
          <Typography
            sx={{
              color: isNegative ? colors.redAccent[300] : colors.greenAccent[300],
              fontWeight: "bold"
            }}
          >
            {!isNaN(value) 
              ? value.toLocaleString('id-ID', { minimumFractionDigits: 0 })
              : params.value}
          </Typography>
        );
      }
    },
    { 
      field: "entitas", 
      headerName: "Entitas", 
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <Avatar
            sx={{ 
              width: 24, 
              height: 24, 
              mr: 1,
              fontSize: '0.7rem',
              bgcolor: `hsl(${params.value.charCodeAt(0) * 10 % 360}, 70%, 40%)`
            }}
          >
            {params.value.charAt(0)}
          </Avatar>
          <Typography>{params.value}</Typography>
        </Box>
      )
    },
    { 
      field: "year", 
      headerName: "Year", 
      flex: 0.7,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Chip
          icon={<CalendarIcon fontSize="small" />}
          label={params.value}
          size="small"
          sx={{
            bgcolor: colors.blueAccent[700] + '33',
            color: colors.blueAccent[300]
          }}
        />
      )
    },
    { 
      field: "posting_period", 
      headerName: "Posting Period", 
      flex: 0.8,
      headerAlign: "center",
      align: "center" 
    },
    { 
      field: "data_date", 
      headerName: "Data Date", 
      flex: 1 
    },
    { 
      field: "__connect_topic", 
      headerName: "Connect Topic", 
      flex: 1,
      renderCell: (params) => (
        <Tooltip title={`Topic: ${params.value}`}>
          <Typography
            variant="body2"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: colors.grey[300]
            }}
          >
            {params.value}
          </Typography>
        </Tooltip>
      )
    },
    { 
      field: "__connect_partition", 
      headerName: "Partition", 
      flex: 0.7,
      headerAlign: "center",
      align: "center"
    },
    { 
      field: "__connect_offset", 
      headerName: "Offset", 
      flex: 0.7,
      headerAlign: "center",
      align: "center"
    },
    { 
      field: "timestamp", 
      headerName: "Timestamp", 
      flex: 1.3,
      renderCell: (params) => {
        const formattedDate = params.value !== "N/A"
          ? new Date(params.value).toLocaleString('id-ID')
          : params.value;
          
        return (
          <Typography variant="body2" sx={{ color: colors.grey[300] }}>
            {formattedDate}
          </Typography>
        );
      }
    }
  ];

  return (
    <Box m="20px">
      {/* Header with title */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
        mb={2}
      >
        <Header title="LAPORAN KEUANGAN SI" subtitle="Analisis Data Keuangan SI" />
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            disabled={loading}
            sx={{
              transition: 'all 0.2s',
              backgroundColor: colors.blueAccent[600],
              '&:hover': { 
                backgroundColor: colors.blueAccent[500],
                transform: 'scale(1.05)'
              }
            }}
          >
            Refresh Data
          </Button>
        </Box>
      </Box>
      
      {/* Statistics Cards */}
      <Box 
        display="flex" 
        gap={2} 
        mb={3}
      >
        {[
          { title: 'Total Entries', value: stats.total, icon: ChartIcon, color: colors.grey[100], bgColor: colors.blueAccent[600] },
          { title: 'Total Value', value: stats.totalValue, icon: MoneyIcon, color: colors.greenAccent[400], bgColor: colors.primary[400] },
          { title: 'Unique Entities', value: stats.uniqueEntities, icon: FilterIcon, color: colors.blueAccent[400], bgColor: colors.primary[400] },
          { title: 'Years Covered', value: stats.uniqueYears, icon: CalendarIcon, color: colors.redAccent[400], bgColor: colors.primary[400] }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={i}
              sx={{ 
                flexGrow: 1,
                background: i === 0 ? stat.bgColor : `${colors.primary[400]}aa`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${stat.color}33`,
                boxShadow: `0 4px 20px ${stat.color}22`,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-5px)' }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Avatar
                    sx={{ 
                      bgcolor: i === 0 ? 'rgba(255,255,255,0.2)' : `${stat.color}22`,
                      mr: 1,
                      width: 32,
                      height: 32
                    }}
                  >
                    <Icon sx={{ color: i === 0 ? 'white' : stat.color, fontSize: 18 }} />
                  </Avatar>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold"
                    sx={{ color: i === 0 ? colors.grey[100] : colors.grey[300] }}
                  >
                    {stat.title}
                  </Typography>
                </Box>
                <Typography 
                  variant="h3" 
                  fontWeight="bold"
                  sx={{ 
                    color: i === 0 ? 'white' : stat.color,
                    textShadow: i === 0 ? '0 0 10px rgba(255,255,255,0.3)' : 'none',
                    mb: 1
                  }}
                >
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>
      
      {/* Loading indicator */}
      {loading && (
        <LinearProgress 
          sx={{ 
            mb: 2, 
            borderRadius: 5,
            height: 6,
            backgroundColor: colors.grey[800],
            '& .MuiLinearProgress-bar': {
              backgroundColor: colors.greenAccent[500]
            }
          }} 
        />
      )}
      
      {/* Data Grid */}
      <Paper
        elevation={3}
        sx={{
          height: "65vh",
          background: `${colors.primary[400]}aa`,
          backdropFilter: 'blur(10px)',
          borderRadius: '10px',
          overflow: 'hidden',
          border: `1px solid ${colors.grey[700]}`,
        }}
      >
        <DataGrid 
          rows={data} 
          columns={columns}
          components={{ 
            Toolbar: GridToolbar
          }}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 },
            },
          }}
          pageSizeOptions={[25, 50, 100]}
          loading={loading}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': { 
              borderBottom: `1px solid ${colors.grey[800]}`,
              padding: '16px',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: colors.blueAccent[800],
              borderBottom: 'none',
              paddingTop: '8px',
              paddingBottom: '8px',
            },
            '& .MuiDataGrid-virtualScroller': {
              backgroundColor: 'transparent',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: 'none',
              backgroundColor: colors.blueAccent[800],
            },
            '& .MuiCheckbox-root': {
              color: `${colors.greenAccent[200]} !important`,
            },
            '& .MuiDataGrid-toolbarContainer .MuiButton-text': {
              color: `${colors.grey[100]} !important`,
            },
            '& .MuiDataGrid-row': {
              transition: 'background-color 0.2s',
              '&:hover': {
                backgroundColor: `${colors.primary[500]}80 !important`,
              },
            },
            '& .MuiDataGrid-columnSeparator': {
              display: 'none',
            },
          }}
        />
      </Paper>
      
      {/* Footer action buttons - only export remains */}
      <Box display="flex" justifyContent="flex-end" mt={2} gap={1}>
        <Tooltip title="Export to Excel">
          <IconButton
            onClick={handleExportToExcel}
            sx={{
              bgcolor: colors.greenAccent[700] + '33',
              '&:hover': { bgcolor: colors.greenAccent[700] + '55' }
            }}
          >
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Information Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            borderRadius: '10px',
            background: colors.primary[400],
            backgroundImage: dialogType === 'error' 
              ? `radial-gradient(${colors.redAccent[700]}20 2px, transparent 2px)` 
              : dialogType === 'success'
                ? `radial-gradient(${colors.greenAccent[700]}20 2px, transparent 2px)`
                : `radial-gradient(${colors.blueAccent[700]}20 2px, transparent 2px)`,
            backgroundSize: '15px 15px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: dialogType === 'error' 
            ? colors.redAccent[500] 
            : dialogType === 'success'
              ? colors.greenAccent[500]
              : dialogType === 'warning'
                ? colors.orange[500]
                : colors.blueAccent[500],
        }} />
        
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            {dialogType === 'error' ? (
              <ErrorIcon sx={{ color: colors.redAccent[500] }} />
            ) : dialogType === 'success' ? (
              <CheckCircleIcon sx={{ color: colors.greenAccent[500] }} />
            ) : dialogType === 'warning' ? (
              <WarningIcon sx={{ color: colors.orange[500] }} />
            ) : (
              <InfoIcon sx={{ color: colors.blueAccent[500] }} />
            )}
            <Typography variant="h5" fontWeight="bold">
              {dialogType === 'error' ? 'Error' : 
               dialogType === 'success' ? 'Sukses' : 
               dialogType === 'warning' ? 'Peringatan' : 'Informasi'}
            </Typography>
          </Box>
          <IconButton 
            onClick={handleCloseDialog}
            size="small"
            sx={{ color: colors.grey[400] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 1 }}>
          <Typography>{dialogMessage}</Typography>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDialog} 
            variant="contained"
            sx={{
              bgcolor: dialogType === 'error' 
                ? colors.redAccent[500] 
                : dialogType === 'success'
                  ? colors.greenAccent[500]
                  : dialogType === 'warning'
                    ? colors.orange[500]
                    : colors.blueAccent[500],
              '&:hover': {
                bgcolor: dialogType === 'error' 
                  ? colors.redAccent[400] 
                  : dialogType === 'success'
                    ? colors.greenAccent[400]
                    : dialogType === 'warning'
                      ? colors.orange[400]
                      : colors.blueAccent[400],
              }
            }}
          >
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinancialStatements;