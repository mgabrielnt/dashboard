import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useTheme } from "@mui/material";
import axios from "axios";

const FinancialStatements = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [data, setData] = useState([]);

  // Fetch data dari backend PostgreSQL
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/contacts2")
      .then(response => {
        // Pastikan setiap baris data memiliki 'id'
        const formattedData = response.data.map(item => ({
          id: item.id,
          connect_topic: item.__connect_topic || "N/A",
          connect_partition: item.__connect_partition || "N/A",
          connect_offset: item.__connect_offset || "N/A",
          coa: item.coa || "N/A",
          value: item.value || "N/A",
          entitas: item.entitas || "N/A",
          year: item.year || "N/A",
          posting_period: item.posting_period || "N/A",
          data_date: item.data_date || "N/A",
          timestamp: item.timestamp || "N/A",
        }));
        setData(formattedData);
      })
      .catch(error => console.error("Error fetching financial statements:", error));
  }, []);

  const columns = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "connect_topic", headerName: "Connect Topic", flex: 1 },
    { field: "connect_partition", headerName: "Connect Partition", flex: 1 },
    { field: "connect_offset", headerName: "Connect Offset", flex: 1 },
    { field: "coa", headerName: "COA", flex: 1 },
    { field: "value", headerName: "Value", flex: 2 },
    { field: "entitas", headerName: "Entitas", flex: 1 },
    { field: "year", headerName: "Year", flex: 1 },
    { field: "posting_period", headerName: "Posting Period", flex: 1 },
    { field: "data_date", headerName: "Data Date", flex: 1 },
    { field: "timestamp", headerName: "Timestamp", flex: 1 },
  ];

  return (
    <Box m="20px">
      <Header title="FINANCIAL STATEMENTS" subtitle="List of Financial Data for Analysis" />
      <Box
        m="40px 0 0 0"
        height="75vh"
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
          getRowId={(row) => `${row.connect_topic}-${row.connect_offset}`} // ID unik
          components={{ Toolbar: GridToolbar }} 
        />
      </Box>
    </Box>
  );
};

export default FinancialStatements;
