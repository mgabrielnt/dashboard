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
      .get("http://localhost:5000/api/contacts")
      .then(response => {
        // Pastikan setiap baris data memiliki 'id'
        const formattedData = response.data.map(item => ({
          id: item.id,
          code_fs: item.code_fs || "N/A",
          code_calk: item.code_calk || "N/A",
          coa_holding: item.coa_holding || "N/A",
          description: item.description || "N/A",
          type: item.type || "N/A",
        }));
        setData(formattedData);
      })
      .catch(error => console.error("Error fetching financial statements:", error));
  }, []);

  const columns = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "code_fs", headerName: "Code FS", flex: 1 },
    { field: "code_calk", headerName: "Code Calk", flex: 1 },
    { field: "coa_holding", headerName: "COA Holding", flex: 1 },
    { field: "description", headerName: "Description", flex: 2 },
    { field: "type", headerName: "Type", flex: 1 },
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
        <DataGrid rows={data} columns={columns} components={{ Toolbar: GridToolbar }} />
      </Box>
    </Box>
  );
};

export default FinancialStatements;
