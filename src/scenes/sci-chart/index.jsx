import { Box, useTheme, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import Header from "../../components/Header";
import BarsciChart from "../../components/BarsciChart";
import { tokens } from "../../theme";
import TimeRangeNavbar from "../../components/TimeRangeNavbar";
import Breadcrumb from "../../components/Breadcrumb";
import { useState } from "react";

const SciChartPage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [chartHeight, setChartHeight] = useState("75vh");

  const handleTimeRangeChange = (data) => {
    console.log("Time range changed:", data);
    // Additional handling if needed
  };

  // Define breadcrumb items
  const breadcrumbItems = [
    { label: "Charts", path: "/" },
    { label: "SCI Bar Chart" }
  ];

  // Handler for chart height change
  const handleChartHeightChange = (event) => {
    setChartHeight(event.target.value);
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="SCI BAR CHART" subtitle="Monthly SCI Trends (Up to 5 Years)" />
        
        {/* Chart height selector */}
        <FormControl sx={{ width: 150 }}>
          <InputLabel id="chart-height-label">Chart Height</InputLabel>
          <Select
            labelId="chart-height-label"
            id="chart-height-select"
            value={chartHeight}
            label="Chart Height"
            onChange={handleChartHeightChange}
          >
            <MenuItem value="75vh">Normal</MenuItem>
            <MenuItem value="85vh">Larger</MenuItem>
            <MenuItem value="95vh">Full Size</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Breadcrumb navigation */}
      <Breadcrumb items={breadcrumbItems} />

      <Box
        height={chartHeight}
        border={`1px solid ${colors.grey[100]}`}
        borderRadius="4px"
        p="15px"
      >
        <BarsciChart />
      </Box>
    </Box>
  );
};

export default SciChartPage;