import { useTheme } from "@mui/material";
import { ResponsiveBar } from "@nivo/bar";
import { tokens } from "../theme";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Box, Typography, CircularProgress, IconButton, Tooltip, Modal, FormControl, Select, MenuItem } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DateRangeIcon from "@mui/icons-material/DateRange";

const BarsiChart = ({ isDashboard = false, timeRange = { type: '24h' } }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartTimeRange, setChartTimeRange] = useState(timeRange);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [displayMode, setDisplayMode] = useState('monthly'); // 'monthly', 'quarterly', 'yearly'
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const chartRef = useRef(null);

  // Update local state when timeRange prop changes
  useEffect(() => {
    if (timeRange && JSON.stringify(timeRange) !== JSON.stringify(chartTimeRange)) {
      console.log("BarsiChart: TimeRange prop changed:", timeRange);
      setChartTimeRange(timeRange);
      fetchData(timeRange);
    }
  }, [timeRange]);

  // Format date for API requests (YYYY-MM-DD)
  const formatDateForDb = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get available periods
  const fetchAvailablePeriods = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/barsi/available-periods", {
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        setAvailablePeriods(response.data);
        console.log("Available periods:", response.data);
      }
    } catch (error) {
      console.error("Error fetching available periods:", error);
    }
  };

  const fetchData = async (range = chartTimeRange) => {
    try {
      setLoading(true);
      console.log("BarsiChart: Fetching data with range:", range);
      
      // Build query parameters based on the time range
      const params = new URLSearchParams();
      
      if (range.startYear && range.endYear) {
        params.append('startYear', range.startYear);
        params.append('endYear', range.endYear);
      }
      
      if (range.startMonth && range.endMonth) {
        params.append('startMonth', range.startMonth);
        params.append('endMonth', range.endMonth);
      }
      
      // Add formatted dates if available
      if (range.startDate) {
        const startDateStr = formatDateForDb(range.startDate);
        if (startDateStr) params.append('startDate', startDateStr);
      }
      
      if (range.endDate) {
        const endDateStr = formatDateForDb(range.endDate);
        if (endDateStr) params.append('endDate', endDateStr);
      }
      
      // Generate the API URL with parameters
      const apiUrl = params.toString() 
        ? `http://localhost:5000/api/barsi?${params.toString()}`
        : "http://localhost:5000/api/barsi";
      
      console.log("BarsiChart: API request URL:", apiUrl);
      
      // Configure axios with all credentials options
      const response = await axios.get(apiUrl, {
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const jsonData = response.data;
      console.log('Raw API Response:', jsonData);
      
      // Process data with detailed logging
      let processedData;
      if (Array.isArray(jsonData)) {
        console.log('Using direct array data');
        processedData = jsonData;
      } else if (jsonData && typeof jsonData === 'object') {
        if (Array.isArray(jsonData.data)) {
          console.log('Using nested data array');
          processedData = jsonData.data;
        } else if (jsonData.results && Array.isArray(jsonData.results)) {
          console.log('Using results array');
          processedData = jsonData.results;
        } else if (jsonData.rows && Array.isArray(jsonData.rows)) {
          console.log('Using rows array');
          processedData = jsonData.rows;
        } else {
          console.log('Converting object to array');
          processedData = Object.keys(jsonData).map(key => {
            return { bulan: key, si: jsonData[key] };
          });
        }
      } else {
        throw new Error("Invalid data format received from server");
      }
      
      // Format the data based on display mode
      processedData = processDataByMode(processedData, displayMode);
      
      console.log('Processed data:', processedData);
      
      setData(processedData);
      setError(null);
    } catch (error) {
      console.error("Error fetching bar chart data:", error);
      setError(error.message || "Failed to load SI data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Process data based on display mode (monthly, quarterly, yearly)
  const processDataByMode = (rawData, mode) => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return [];
    }

    // Ensure all data has the expected format
    const standardData = rawData.map(item => ({
      year: item.year || new Date().getFullYear(),
      bulan: item.bulan || item.month || 1,
      si: item.si || item.value || 0
    }));

    if (mode === 'monthly') {
      // Format for monthly display (YYYY-MM)
      return standardData.map(item => ({
        bulan: `${item.year}-${String(item.bulan).padStart(2, '0')}`,
        si: item.si,
        year: item.year
      }));
    } 
    else if (mode === 'quarterly') {
      // Group by quarter
      const quarterData = {};
      
      standardData.forEach(item => {
        const month = parseInt(item.bulan);
        const quarter = Math.ceil(month / 3);
        const key = `${item.year}-Q${quarter}`;
        
        if (!quarterData[key]) {
          quarterData[key] = { bulan: key, si: 0, count: 0, year: item.year, quarter };
        }
        
        quarterData[key].si += item.si;
        quarterData[key].count += 1;
      });
      
      // Calculate averages and convert to array
      return Object.values(quarterData).map(item => ({
        bulan: item.bulan,
        si: item.count > 0 ? item.si / item.count : 0, // average
        year: item.year,
        quarter: item.quarter
      })).sort((a, b) => {
        // Sort by year and quarter
        if (a.year !== b.year) return a.year - b.year;
        return a.quarter - b.quarter;
      });
    } 
    else if (mode === 'yearly') {
      // Group by year
      const yearData = {};
      
      standardData.forEach(item => {
        const year = item.year;
        
        if (!yearData[year]) {
          yearData[year] = { bulan: year.toString(), si: 0, count: 0, year };
        }
        
        yearData[year].si += item.si;
        yearData[year].count += 1;
      });
      
      // Calculate averages and convert to array
      return Object.values(yearData).map(item => ({
        bulan: item.bulan,
        si: item.count > 0 ? item.si / item.count : 0, // average
        year: item.year
      })).sort((a, b) => a.year - b.year);
    }
    
    // Default to monthly format
    return standardData;
  };

  // Initial data load and fetch available periods
  useEffect(() => {
    fetchAvailablePeriods();
    fetchData(chartTimeRange);
  }, []);

  // When display mode changes
  useEffect(() => {
    // Reprocess the existing data with the new display mode
    if (data && data.length > 0) {
      const reprocessedData = processDataByMode(data, displayMode);
      setData(reprocessedData);
    }
  }, [displayMode]);

  // Download chart as image
  const handleDownloadChart = () => {
    const svg = chartRef.current.querySelector('svg');
    if (!svg) {
      console.error('SVG element not found');
      return;
    }
    
    try {
      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
      
      // Create link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `si-chart-${displayMode}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error downloading chart:', error);
      alert('Could not download chart. Please try again.');
    }
  };
  
  // Show chart information modal
  const handleShowInfo = () => {
    setInfoModalOpen(true);
  };

  // Close chart information modal
  const handleCloseInfo = () => {
    setInfoModalOpen(false);
  };

  // Handle display mode change
  const handleDisplayModeChange = (event) => {
    setDisplayMode(event.target.value);
  };

  // Handle loading and error states
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={isDashboard ? "250px" : "300px"}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={isDashboard ? "250px" : "300px"}>
        <Typography variant="h6" color={colors.grey[100]}>Error: {error}</Typography>
      </Box>
    );
  }

  // Verify data has elements before rendering
  if (!data || data.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={isDashboard ? "250px" : "300px"}>
        <Typography variant="h6" color={colors.grey[100]}>No data available for SI chart</Typography>
      </Box>
    );
  }

  // Format tooltip based on display mode
  const getTooltipContent = ({ id, value, color, indexValue }) => {
    let formattedValue = value.toLocaleString(undefined, { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    let tooltipLabel = indexValue;
    if (displayMode === 'quarterly') {
      tooltipLabel = `Quarter ${indexValue.split('-Q')[1]} of ${indexValue.split('-Q')[0]}`;
    } else if (displayMode === 'yearly') {
      tooltipLabel = `Year ${indexValue}`;
    }
    
    return (
      <div style={{ 
        padding: '8px 12px', 
        background: colors.primary[400],
        color: colors.grey[100],
        boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.2)',
        fontSize: '14px',
        borderRadius: '4px',
      }}>
        <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>
          {tooltipLabel}
        </div>
        <div style={{ 
          color: color,
          padding: '3px 0',
          fontWeight: 'bold'
        }}>
          {formattedValue}
        </div>
      </div>
    );
  };

  // Get axis label based on display mode
  const getAxisLabel = () => {
    switch(displayMode) {
      case 'quarterly': return 'Quarter';
      case 'yearly': return 'Year';
      default: return 'Month';
    }
  };

  return (
    <Box sx={{ 
      height: isDashboard ? "100%" : "75vh", 
      width: "100%",
      position: "relative",
      paddingTop: isDashboard ? "20px" : "0"
    }}>
      {/* Action buttons and display mode selector */}
      {!isDashboard && (
        <Box sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          padding: "0 20px 10px 0",
          gap: 1
        }}>
          {/* Display mode selector */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={displayMode}
              onChange={handleDisplayModeChange}
              variant="outlined"
              size="small"
              sx={{
                backgroundColor: colors.primary[400],
                color: colors.grey[100],
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary[500],
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary[300],
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.redAccent[500],
                },
              }}
            >
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="quarterly">Quarterly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
          
          {/* Action buttons */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Refresh data">
              <IconButton 
                size="small"
                onClick={() => fetchData(chartTimeRange)}
                sx={{
                  backgroundColor: colors.primary[500],
                  color: colors.grey[100],
                  '&:hover': { backgroundColor: colors.primary[600] }
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Download chart">
              <IconButton 
                size="small"
                onClick={handleDownloadChart}
                sx={{
                  backgroundColor: colors.primary[500],
                  color: colors.grey[100],
                  '&:hover': { backgroundColor: colors.primary[600] }
                }}
              >
                <DownloadOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Chart information">
              <IconButton 
                size="small"
                onClick={handleShowInfo}
                sx={{
                  backgroundColor: colors.primary[500],
                  color: colors.grey[100],
                  '&:hover': { backgroundColor: colors.primary[600] }
                }}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Time range indicator */}
            <Tooltip title={`Current time range: ${chartTimeRange.type}`}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: colors.primary[500],
                  borderRadius: '4px',
                  padding: '4px 8px',
                  marginLeft: 1
                }}
              >
                <DateRangeIcon fontSize="small" sx={{ marginRight: '4px' }} />
                <Typography variant="caption" sx={{ color: colors.grey[100] }}>
                  {chartTimeRange.type === 'custom' 
                    ? `${formatDateForDb(chartTimeRange.startDate)} to ${formatDateForDb(chartTimeRange.endDate)}`
                    : chartTimeRange.type}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Box>
      )}
      
      <Box 
        ref={chartRef}
        sx={{ 
          height: isDashboard ? "100%" : "calc(75vh - 50px)", 
          width: "100%"
        }}
      >
        <ResponsiveBar
          data={data}
          keys={["si"]}
          indexBy="bulan"
          theme={{
            axis: {
              domain: {
                line: {
                  stroke: colors.redAccent[100],
                },
              },
              legend: {
                text: {
                  fill: colors.grey[100],
                },
              },
              ticks: {
                line: {
                  stroke: colors.grey[100],
                  strokeWidth: 1,
                },
                text: {
                  fill: colors.grey[100],
                  fontSize: displayMode === 'monthly' ? 10 : 12, // Smaller font for monthly view
                },
              },
            },
            legends: {
              text: {
                fill: colors.grey[100],
              },
            },
            tooltip: {
              container: {
                background: colors.primary[400],
                color: colors.grey[100],
                fontSize: 12,
                borderRadius: 4,
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
                padding: 8,
              },
            },
          }}
          margin={{ top: 50, right: 130, bottom: displayMode === 'monthly' ? 60 : 50, left: 60 }}
          padding={0.3}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          colors={{ scheme: "blues" }}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: displayMode === 'monthly' ? 45 : 0, // Rotate labels for monthly view
            legend: isDashboard ? undefined : getAxisLabel(),
            legendPosition: "middle",
            legendOffset: 32,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: isDashboard ? undefined : "SI",
            legendPosition: "middle",
            legendOffset: -40,
            format: (value) => 
              value >= 1000000000 
                ? `${(value / 1000000000).toFixed(1)} M` 
                : value.toLocaleString()
          }}
          enableLabel={false}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{
            from: "color",
            modifiers: [["darker", 1.6]],
          }}
          tooltip={getTooltipContent}
          legends={[
            {
              dataFrom: "keys",
              anchor: "bottom-right",
              direction: "column",
              justify: false,
              translateX: 120,
              translateY: 0,
              itemsSpacing: 2,
              itemWidth: 100,
              itemHeight: 20,
              itemDirection: "left-to-right",
              itemOpacity: 0.85,
              symbolSize: 20,
              effects: [
                {
                  on: "hover",
                  style: {
                    itemOpacity: 1,
                  },
                },
              ],
            },
          ]}
          role="application"
          barAriaLabel={function (e) {
            return `SI for ${e.indexValue}: ${e.formattedValue}`;
          }}
          animate={true}
          motionStiffness={90}
          motionDamping={15}
          isInteractive={true}
        />
      </Box>
      
      {/* Chart Information Modal */}
      <Modal
        open={infoModalOpen}
        onClose={handleCloseInfo}
        aria-labelledby="chart-info-modal-title"
        aria-describedby="chart-info-modal-description"
        sx={{ zIndex: 1600 }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            backgroundColor: colors.primary[400],
            border: `1px solid ${colors.primary[500]}`,
            boxShadow: 24,
            p: 4,
            borderRadius: '8px',
            zIndex: 1600,
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography id="chart-info-modal-title" variant="h5" component="h2">
              SI Chart Information
            </Typography>
            <IconButton onClick={handleCloseInfo} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Typography id="chart-info-modal-description" sx={{ mt: 2 }}>
            This chart displays the SI (Standard Internasional) data over time. You can 
            view the data in monthly, quarterly, or yearly formats using the dropdown selector.
          </Typography>
          
          <Typography sx={{ mt: 2 }}>
            {displayMode === 'monthly' && "Each bar represents the SI value for a specific month."}
            {displayMode === 'quarterly' && "Each bar represents the average SI value for a quarter (3 months)."}
            {displayMode === 'yearly' && "Each bar represents the average SI value for an entire year."}
            {" Values over 1 billion are displayed in millions."}
          </Typography>
          
          <Box mt={3} sx={{ backgroundColor: colors.primary[500], p: 2, borderRadius: '4px' }}>
            <Typography variant="body2" color={colors.grey[300]}>
              Data is filtered according to the selected time range in the dashboard.
              {availablePeriods.length > 0 && ` Available data spans from ${availablePeriods[0].year} to ${availablePeriods[availablePeriods.length-1].year}.`}
            </Typography>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default BarsiChart;