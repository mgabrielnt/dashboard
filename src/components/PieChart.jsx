import { ResponsivePie } from "@nivo/pie";
import { tokens } from "../theme";
import { useTheme } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Box, Typography, CircularProgress, IconButton, Tooltip, Modal } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";

const PieChart = ({ isDashboard = false, timeRange = { type: '24h' } }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartTimeRange, setChartTimeRange] = useState(timeRange);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const chartRef = useRef(null);

  // Update local state when timeRange prop changes
  useEffect(() => {
    if (timeRange && JSON.stringify(timeRange) !== JSON.stringify(chartTimeRange)) {
      console.log("PieChart: TimeRange prop changed:", timeRange);
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

  // Function to fetch data with time range parameters
  const fetchData = async (range = chartTimeRange) => {
    try {
      setLoading(true);
      console.log("PieChart: Fetching data with range:", range);
      
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
        ? `http://localhost:5000/api/pie?${params.toString()}`
        : "http://localhost:5000/api/pie";
      
      console.log("PieChart: API request URL:", apiUrl);
      
      const response = await axios.get(apiUrl);
      
      // Format the values as billions for better readability
      const formattedData = response.data.map((item, index) => ({
        ...item,
        value: item.value, // Keep original value for calculations
        formattedValue: (item.value / 1000000000).toFixed(2) + " B", // For display
        color: getColorByIndex(index) // Assign consistent colors
      }));
      
      setData(formattedData);
      setError(null);
    } catch (err) {
      console.error("PieChart: Failed to fetch data:", err);
      setError("Failed to load data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData(chartTimeRange);
  }, []);

  // Function to generate consistent colors for pie segments
  const getColorByIndex = (index) => {
    const colorScheme = [
      colors.greenAccent[500],
      colors.blueAccent[400],
      colors.redAccent[500],
      colors.grey[400]
    ];
    return colorScheme[index % colorScheme.length];
  };

  // Format large numbers to billions with 2 decimal places
  const formatToBillions = (value) => {
    return `${(value / 1000000000).toFixed(2)} B`;
  };
  
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
      link.download = `campaign-breakdown-chart.svg`;
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

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={isDashboard ? "250px" : "300px"}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={isDashboard ? "250px" : "300px"}>
        <Typography variant="h6" color={colors.grey[100]}>Error: {error}</Typography>
      </Box>
    );
  }

  // No data state
  if (!data || data.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={isDashboard ? "250px" : "300px"}>
        <Typography variant="h6" color={colors.grey[100]}>No data available</Typography>
      </Box>
    );
  }

  // Render chart
  return (
    <Box sx={{ 
      height: isDashboard ? "100%" : "75vh", 
      width: "100%",
      position: "relative",
      paddingTop: isDashboard ? "20px" : "0"
    }}>
      {/* Action buttons (only shown when not in dashboard mode) */}
      {!isDashboard && (
        <Box sx={{ 
          display: "flex", 
          justifyContent: "flex-end", 
          padding: "0 20px 10px 0",
          gap: 1
        }}>
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
        </Box>
      )}
      
      <Box 
        ref={chartRef}
        sx={{ 
          height: isDashboard ? "100%" : "calc(75vh - 50px)", 
          width: "100%",
          zIndex: 5
        }}
      >
        <ResponsivePie
          data={data}
          theme={{
            axis: {
              domain: {
                line: {
                  stroke: colors.grey[100],
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
              },
            },
          }}
          margin={{ 
            top: 40, 
            right: 80, 
            bottom: 100, 
            left: 80 
          }}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={3}
          activeOuterRadiusOffset={8}
          colors={{ datum: 'data.color' }}
          borderColor={{
            from: "color",
            modifiers: [["darker", 0.2]],
          }}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor={colors.grey[100]}
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: "color" }}
          enableArcLabels={false} // Remove values from the pie chart segments
          arcLabelsRadiusOffset={0.4}
          arcLabelsSkipAngle={7}
          arcLabelsTextColor={{
            from: "color",
            modifiers: [["darker", 2]],
          }}
          defs={[
            {
              id: 'dots',
              type: 'patternDots',
              background: 'inherit',
              color: 'rgba(255, 255, 255, 0.3)',
              size: 4,
              padding: 1,
              stagger: true
            },
            {
              id: 'lines',
              type: 'patternLines',
              background: 'inherit',
              color: 'rgba(255, 255, 255, 0.3)',
              rotation: -45,
              lineWidth: 6,
              spacing: 10
            }
          ]}
          tooltip={({ datum }) => (
            <div
              style={{
                padding: "12px",
                background: colors.primary[400],
                color: colors.grey[100],
                border: `1px solid ${colors.grey[400]}`,
                borderRadius: "4px",
              }}
            >
              <strong>{datum.label}:</strong> {formatToBillions(datum.value)} IDR
              <br />
              <small>({((datum.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)</small>
            </div>
          )}
          legends={[
            {
              anchor: "bottom",
              direction: "row",
              justify: false,
              translateX: 0,
              translateY: 56,
              itemsSpacing: 5,
              itemWidth: 120,
              itemHeight: 18,
              itemTextColor: colors.grey[100],
              itemDirection: "left-to-right",
              itemOpacity: 1,
              symbolSize: 18,
              symbolShape: "circle",
              effects: [
                {
                  on: "hover",
                  style: {
                    itemTextColor: colors.grey[200],
                  },
                },
              ],
            },
          ]}
        />
      </Box>
      
      {/* Chart Information Modal */}
      <Modal
        open={infoModalOpen}
        onClose={handleCloseInfo}
        aria-labelledby="chart-info-modal-title"
        aria-describedby="chart-info-modal-description"
        sx={{ zIndex: 1600 }} // Increased z-index to ensure it appears on top
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
            zIndex: 1600, // Added z-index here as well
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography id="chart-info-modal-title" variant="h5" component="h2">
              Campaign Breakdown Information
            </Typography>
            <IconButton onClick={handleCloseInfo} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Typography id="chart-info-modal-description" sx={{ mt: 2 }}>
            This chart displays the campaign breakdown data in billions of currency units.
          </Typography>
          
          <Typography sx={{ mt: 2 }}>
            The pie chart segments represent different campaign categories and their relative proportions of the total budget.
          </Typography>
          
          <Typography sx={{ mt: 1 }}>
            <strong>Hover over any segment</strong> to see detailed information including the exact value and percentage.
          </Typography>
          
          <Box mt={3} sx={{ backgroundColor: colors.primary[500], p: 2, borderRadius: '4px' }}>
            <Typography variant="body2" color={colors.grey[300]}>
              Data is filtered according to the selected time range in the dashboard.
            </Typography>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default PieChart;