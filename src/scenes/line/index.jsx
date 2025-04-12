import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import Header from "../../components/Header";
import LineChart from "../../components/LineChart";
import { useState } from "react";

const Line = () => {
  const [chartHeight, setChartHeight] = useState("75vh");

  // Handler for chart height change
  const handleChartHeightChange = (event) => {
    setChartHeight(event.target.value);
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Line Chart" subtitle="Comparative Trend Analysis (Up to 5 Years)" />
        
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
      
      <Box height={chartHeight}>
        <LineChart />
      </Box>
    </Box>
  );
};

export default Line;