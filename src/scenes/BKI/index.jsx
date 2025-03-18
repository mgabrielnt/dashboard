import { useState, useEffect } from "react";
import { Box, TextField, Button, Grid, MenuItem } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useTheme } from "@mui/material";
import axios from "axios";

const FinancialStatements = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    year_start: "",
    year_end: "",
    month_start: "",
    month_end: ""
  });

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Fetch data with filters
  const fetchData = () => {
    setLoading(true);
    
    // Build query params
    const params = {};
    if (filters.year_start) params.year_start = filters.year_start;
    if (filters.year_end) params.year_end = filters.year_end;
    if (filters.month_start) params.month_start = filters.month_start;
    if (filters.month_end) params.month_end = filters.month_end;
    
    axios
      .get("http://localhost:5000/api/bki", { params })
      .then(response => {
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
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching financial statements:", error);
        setLoading(false);
      });
  };

  // Initial data load
  useEffect(() => {
    fetchData();
  }, []);

  // Generate month options
  const monthOptions = [];
  for (let i = 1; i <= 12; i++) {
    monthOptions.push(
      <MenuItem key={i} value={i}>{`${i < 10 ? '0' : ''}${i}`}</MenuItem>
    );
  }

  // Generate year options (last 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 4; i <= currentYear; i++) {
    yearOptions.push(
      <MenuItem key={i} value={i}>{i}</MenuItem>
    );
  }

  const columns = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "__connect_topic", headerName: "Connect Topic", flex: 1 },
    { field: "__connect_partition", headerName: "Connect Partition", flex: 1 },
    { field: "__connect_offset", headerName: "Connect Offset", flex: 1 },
    { field: "coa", headerName: "COA", flex: 1 },
    { field: "value", headerName: "Value", flex: 1 },
    { field: "entitas", headerName: "Entitas", flex: 1 },
    { field: "year", headerName: "Year", flex: 1 },
    { field: "posting_period", headerName: "Posting Period", flex: 1 },
    { field: "data_date", headerName: "Data Date", flex: 1 },
    { field: "timestamp", headerName: "Timestamp", flex: 1.5 },
  ];

  return (
    <Box m="20px">
      <Header title="FINANCIAL STATEMENTS" subtitle="List of Financial Data for Analysis" />
      
      {/* Filter section */}
      <Box mb="20px" p="20px" backgroundColor={colors.primary[400]} borderRadius="4px">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box fontWeight="bold" mb="10px">Filter Data</Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              name="year_start"
              label="Tahun Awal"
              value={filters.year_start}
              onChange={handleFilterChange}
              variant="outlined"
              size="small"
            >
              <MenuItem value="">- Pilih Tahun -</MenuItem>
              {yearOptions}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              name="year_end"
              label="Tahun Akhir"
              value={filters.year_end}
              onChange={handleFilterChange}
              variant="outlined"
              size="small"
            >
              <MenuItem value="">- Pilih Tahun -</MenuItem>
              {yearOptions}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              name="month_start"
              label="Bulan Awal"
              value={filters.month_start}
              onChange={handleFilterChange}
              variant="outlined"
              size="small"
            >
              <MenuItem value="">- Pilih Bulan -</MenuItem>
              {monthOptions}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              name="month_end"
              label="Bulan Akhir"
              value={filters.month_end}
              onChange={handleFilterChange}
              variant="outlined"
              size="small"
            >
              <MenuItem value="">- Pilih Bulan -</MenuItem>
              {monthOptions}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              onClick={fetchData}
              disabled={loading}
              sx={{ 
                backgroundColor: colors.blueAccent[700],
                '&:hover': { backgroundColor: colors.blueAccent[800] }
              }}
            >
              {loading ? "Loading..." : "Tampilkan Data"}
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      <Box
        height="65vh"
        sx={{
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
          "& .MuiCheckbox-root": { color: `${colors.greenAccent[200]} !important` },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": { color: `${colors.grey[100]} !important` },
        }}
      >
        <DataGrid 
          rows={data} 
          columns={columns}
          components={{ Toolbar: GridToolbar }}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 },
            },
          }}
          pageSizeOptions={[25, 50, 100]}
          loading={loading}
        />
      </Box>
    </Box>
  );
};

export default FinancialStatements;