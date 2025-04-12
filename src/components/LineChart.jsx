import { useEffect, useState, useMemo, useRef } from "react";
import { ResponsiveLine } from "@nivo/line";
import { tokens } from "../theme";
import { useTheme } from "@mui/material";
import axios from "axios";
import { Box, Typography, CircularProgress, Tabs, Tab, IconButton, Tooltip, Modal } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CompactTimeRangeSelector from "../components/CompactTimeRangeSelector";

const LineChart = ({ isDashboard = false, timeRange = { type: '24h' } }) => {
  console.log("LineChart props:", { isDashboard, timeRange });
  
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartTimeRange, setChartTimeRange] = useState(timeRange);
  const [periodInfo, setPeriodInfo] = useState({ minYear: 2020, maxYear: 2024 });
  const [activeTab, setActiveTab] = useState(0);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const chartRef = useRef(null);

  // Chart view options
  const chartViews = useMemo(() => [
    { label: "BKI", value: "bki" },
    { label: "SCI", value: "sci" },
    { label: "SI", value: "si" },
    { label: "ALL", value: "all" }
  ], []);

  // Transform API data for the chart
  const transformData = (apiData) => {
    // Check if API data exists and has content
    if (!apiData || apiData.length === 0) {
      console.warn("No data received from API");
      setData([]);
      setIsLoading(false);
      return;
    }

    try {
      // Find min and max years in the data
      const years = apiData.map(item => parseInt(item.year));
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      setPeriodInfo({ minYear, maxYear });

      // Determine if the data has a semester field
      const hasMonthField = apiData.some(item => item.hasOwnProperty('bulan'));
      
      // Organize data by period - either semester or month
      let dataPoints = [];
      
      if (hasMonthField) {
        // Format data points for month data - Always show month and year
        dataPoints = apiData.map(item => {
          const year = parseInt(item.year);
          const month = parseInt(item.bulan);
          return { 
            ...item, 
            // Always format as "Jan 2023" to include month in x-axis
            periodLabel: `${getMonthName(month)} ${year}`,
            // Numeric value for sorting (YYYYMM)
            sortValue: year * 100 + month
          };
        });
      } else {
        // Assuming semester data - check for it
        const hasSemesterField = apiData.some(item => item.hasOwnProperty('semester'));
        
        if (hasSemesterField) {
          // Format for semester data - Always show semester and year
          dataPoints = apiData.map(item => {
            const year = parseInt(item.year);
            return { 
              ...item, 
              // Always format as "S1 2023" to include semester in x-axis
              periodLabel: `${item.semester} ${year}`,
              // Numeric value for sorting (YYYYS)
              sortValue: year * 10 + (item.semester === 'S1' ? 1 : 2)
            };
          });
        } else {
          // Generic fallback if neither month nor semester is present
          // Still try to create month-based labels from any available data
          dataPoints = apiData.map(item => {
            const year = parseInt(item.year);
            // Default to January if no month info is available
            const monthNum = item.month || 1;
            return { 
              ...item, 
              // Always include a month identifier
              periodLabel: `${getMonthName(monthNum)} ${year}`,
              sortValue: year * 100 + monthNum
            };
          });
        }
      }

      // Sort data chronologically
      const sortedData = dataPoints.sort((a, b) => a.sortValue - b.sortValue);

      // Transform the API data into the format required by Nivo Line
      const chartData = [
        {
          id: "BKI",
          color: "#4cceac", // Custom green
          data: []
        },
        {
          id: "SCI",
          color: "#7098da", // Custom blue
          data: []
        },
        {
          id: "SI",
          color: "#ff6b6b", // Custom red
          data: []
        }
      ];

      sortedData.forEach(item => {
        // Convert values to numbers and use the same scale as original (billions)
        const bkiValue = Number(item.bki || 0) / 1000000000;
        const sciValue = Number(item.sci || 0) / 1000000000;
        const siValue = Number(item.si || 0) / 1000000000;
        
        chartData[0].data.push({ x: item.periodLabel, y: bkiValue });
        chartData[1].data.push({ x: item.periodLabel, y: sciValue });
        chartData[2].data.push({ x: item.periodLabel, y: siValue });
      });

      // Ensure data has content
      if (chartData[0].data.length > 0) {
        setData(chartData);
      } else {
        console.warn("Transformed data has no points");
        setData([]);
      }
    } catch (error) {
      console.error("Error transforming data:", error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data function - improved to better handle API requests
  const fetchData = async (range = chartTimeRange) => {
    try {
      setIsLoading(true);
      console.log("Fetching data with range:", range);
      
      // Base query parameters
      const params = new URLSearchParams();
      
      // Always use month groupBy to ensure we show month on x-axis
      params.append('groupBy', 'month');
      
      // Handle different range types with database-friendly parameters
      if (range.startYear && range.endYear && range.startMonth && range.endMonth) {
        // If we have specific year and month parameters, use them directly
        if (range.startYear === range.endYear) {
          params.append('year', range.startYear);
          params.append('startMonth', range.startMonth);
          params.append('endMonth', range.endMonth);
        } else {
          params.append('yearRange', `${range.startYear}-${range.endYear}`);
          params.append('startMonth', range.startMonth);
          params.append('endMonth', range.endMonth);
        }
      } else {
        // For predefined ranges, calculate the database parameters based on date objects
        if (range.startDate && range.endDate) {
          const startYear = range.startDate.getFullYear();
          const startMonth = range.startDate.getMonth() + 1;
          const endYear = range.endDate.getFullYear();
          const endMonth = range.endDate.getMonth() + 1;
          
          if (startYear === endYear) {
            params.append('year', startYear);
            params.append('startMonth', startMonth);
            params.append('endMonth', endMonth);
          } else {
            params.append('yearRange', `${startYear}-${endYear}`);
            params.append('startMonth', startMonth);
            params.append('endMonth', endMonth);
          }
        } else {
          // Fallback to current year/month if no dates provided
          const now = new Date();
          const thisYear = now.getFullYear();
          const thisMonth = now.getMonth() + 1;
          
          params.append('year', thisYear);
          params.append('startMonth', Math.max(1, thisMonth - 3));
          params.append('endMonth', thisMonth);
        }
      }
      
      const apiUrl = `http://localhost:5000/api/line?${params.toString()}`;
      console.log("API request URL:", apiUrl);
      
      try {
        const response = await axios.get(apiUrl);
        console.log("API response:", response.data);
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          transformData(response.data);
        } else {
          console.warn("Empty or invalid response from API");
          setData([]);
          setIsLoading(false);
        }
      } catch (apiError) {
        console.error("API error:", apiError);
        // Handle error state properly
        setIsLoading(false);
        setData([]);
      }
    } catch (error) {
      console.error("Error in fetchData:", error);
      setIsLoading(false);
      setData([]);
    }
  };

  // Update local state when timeRange prop changes
  useEffect(() => {
    if (timeRange && JSON.stringify(timeRange) !== JSON.stringify(chartTimeRange)) {
      console.log("TimeRange prop changed:", timeRange);
      setChartTimeRange(timeRange);
      fetchData(timeRange);
    }
  }, [timeRange]);

  // Initial data load
  useEffect(() => {
    // Use fetchData for all cases to avoid mock data
    fetchData(chartTimeRange);
    
    // Clean-up function
    return () => {
      // Any clean-up needed
    };
  }, []);

  // Handle chart view change
  const handleViewChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle time range change
  const handleTimeRangeChange = (newTimeRange) => {
    console.log("LineChart handleTimeRangeChange:", newTimeRange);
    
    // Ensure we have a complete range object
    const completeTimeRange = {
      ...newTimeRange,
      // Make sure we have startDate and endDate
      startDate: newTimeRange.startDate || calculateStartDate(newTimeRange.type),
      endDate: newTimeRange.endDate || new Date()
    };
    
    setChartTimeRange(completeTimeRange);
    // Refetch data with the new range
    fetchData(completeTimeRange);
  };

  // Download chart as image (using browser's native capabilities)
  const handleDownloadChart = () => {
    // Create a canvas element to draw on
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
      link.download = `financial-performance-${periodInfo.minYear}${periodInfo.minYear !== periodInfo.maxYear ? `-${periodInfo.maxYear}` : ''}.svg`;
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
  
  // Helper function to calculate start date based on time range type
  const calculateStartDate = (type) => {
    const now = new Date();
    switch(type) {
      case '7d':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return sevenDaysAgo;
      case '30d':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return thirtyDaysAgo;
      case '24h':
      default:
        const oneDayAgo = new Date();
        oneDayAgo.setHours(now.getHours() - 24);
        return oneDayAgo;
    }
  };

  // Helper function to get month name
  const getMonthName = (monthNum) => {
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return monthNames[Math.min(Math.max(0, monthNum - 1), 11)];
  };

  // Filter data based on active tab
  const getFilteredData = () => {
    if (!data || data.length === 0) {
      return [];
    }
    
    if (activeTab === chartViews.length - 1) {
      // "All" tab selected
      return data;
    } else {
      // Filter for the selected company
      return data[activeTab] ? [data[activeTab]] : [];
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={isDashboard ? "250px" : "300px"}>
        <CircularProgress />
      </Box>
    );
  }

  // No data state
  if (!data || data.length === 0 || (data[0] && data[0].data && data[0].data.length === 0)) {
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
      display: "flex",
      flexDirection: "column",
      position: "relative",
      zIndex: isDashboard ? 10 : 1, // Higher z-index for dashboard mode
      paddingTop: isDashboard ? "20px" : "0" // Added padding for dashboard mode to prevent elements being too close to the top
    }}>
      {/* Chart Navigation Bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: isDashboard ? 2 : 2, // Increased bottom margin for dashboard mode
          mt: isDashboard ? 1 : 0, // Added top margin for dashboard mode
          px: isDashboard ? 0 : 2,
        }}
      >
        {/* Left side - tabs for different views */}
        <Tabs
          value={activeTab}
          onChange={handleViewChange}
          textColor="secondary"
          indicatorColor="secondary"
          sx={{
            minHeight: isDashboard ? '36px' : '48px',
            '& .MuiTab-root': {
              fontSize: isDashboard ? '0.75rem' : '0.875rem',
              minHeight: isDashboard ? '36px' : '48px',
              py: isDashboard ? 0.5 : 1,
              px: isDashboard ? 1.5 : 2,
            }
          }}
        >
          {chartViews.map((view, index) => (
            <Tab 
              key={view.value} 
              label={view.label} 
              sx={{ 
                color: activeTab === index ? colors.greenAccent[500] : colors.grey[100]
              }}
            />
          ))}
        </Tabs>

        {/* Right side - actions (only shown when not in dashboard/minimized view) */}
        {!isDashboard && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
      </Box>

      {/* Chart Title (only for full view) */}
      {!isDashboard && (
        <Typography 
          variant="h5" 
          color={colors.grey[100]} 
          sx={{ marginBottom: "20px", px: 2 }}
        >
          Financial Performance by Month {periodInfo.minYear}
          {periodInfo.minYear !== periodInfo.maxYear ? ` - ${periodInfo.maxYear}` : ''}
        </Typography>
      )}
      
      {/* The Chart - Using flexGrow to fill available space */}
      <Box 
        ref={chartRef}
        sx={{ 
          flexGrow: 1,
          minHeight: isDashboard ? "200px" : "calc(75vh - 120px)",
          position: "relative",
          zIndex: 5,
          // Ensure the overflow is hidden to prevent cutting in the parent container
          overflow: 'hidden',
          paddingBottom: '40px' // Add extra padding to prevent cutoff
        }}
      >
        <ResponsiveLine
          data={getFilteredData()}
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
                  fontSize: 12,
                  fontWeight: 500
                },
              },
              ticks: {
                line: {
                  stroke: colors.grey[100],
                  strokeWidth: 1,
                },
                text: {
                  fill: colors.grey[100],
                  fontSize: 11
                },
              },
            },
            legends: {
              text: {
                fill: colors.grey[100],
                fontSize: 11
              },
            },
            tooltip: {
              container: {
                color: colors.primary[500],
                background: colors.grey[800],
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.25)'
              },
            },
            grid: {
              line: {
                stroke: colors.grey[800]
              }
            }
          }}
          colors={d => d.color}
          margin={{ 
            top: isDashboard ? 20 : 30, 
            right: isDashboard ? 80 : 110, 
            bottom: isDashboard ? 80 : 100, // Increased bottom margin to prevent cutoff
            left: isDashboard ? 50 : 70 
          }}
          xScale={{ type: "point" }}
          yScale={{
            type: "linear",
            min: "auto",
            max: "auto",
            stacked: false,
            reverse: false,
          }}
          yFormat=" >-.2f"
          curve={isDashboard ? "cardinal" : "monotoneX"}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: isDashboard ? 5 : 10,
            tickRotation: isDashboard ? -45 : -45, // More rotation for better label display
            legend: isDashboard ? undefined : "Period",
            legendOffset: isDashboard ? 50 : 70, // Increased offset
            legendPosition: "middle",
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: isDashboard ? undefined : "Value (in Billions)",
            legendOffset: -55,
            legendPosition: "middle",
          }}
          enableGridX={false}
          enableGridY={!isDashboard}
          pointSize={isDashboard ? 8 : 6}
          pointColor={{ theme: "background" }}
          pointBorderWidth={isDashboard ? 2 : 2}
          pointBorderColor={{ from: "serieColor" }}
          pointLabelYOffset={-12}
          useMesh={true}
          enableArea={!isDashboard}
          areaOpacity={0.15}
          enableSlices="x"
          legends={activeTab === chartViews.length - 1 ? [
            {
              anchor: "bottom-right",
              direction: "column",
              justify: false,
              translateX: 100,
              translateY: 0,
              itemsSpacing: 10,
              itemDirection: "left-to-right",
              itemWidth: 80,
              itemHeight: 20,
              itemOpacity: 0.85,
              symbolSize: 12,
              symbolShape: "circle",
              symbolBorderColor: "rgba(0, 0, 0, .5)",
              effects: [
                {
                  on: "hover",
                  style: {
                    itemBackground: colors.grey[800],
                    itemOpacity: 1,
                  },
                },
              ],
            },
          ] : []}
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
              Chart Information
            </Typography>
            <IconButton onClick={handleCloseInfo} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Typography id="chart-info-modal-description" sx={{ mt: 2 }}>
            This chart displays financial performance data in billions of currency units.
          </Typography>
          
          <Typography sx={{ mt: 2 }}>
            <strong>Data Range:</strong> {periodInfo.minYear}{periodInfo.minYear !== periodInfo.maxYear ? ` - ${periodInfo.maxYear}` : ''}
          </Typography>
          
          <Typography sx={{ mt: 1 }}>
            <strong>BKI:</strong> Represented in green, shows the primary company performance.
          </Typography>
          
          <Typography sx={{ mt: 1 }}>
            <strong>SCI:</strong> Represented in blue, shows the secondary company metrics.
          </Typography>
          
          <Typography sx={{ mt: 1 }}>
            <strong>SI:</strong> Represented in red, shows the subsidiary indicators.
          </Typography>
          
          <Box mt={3} sx={{ backgroundColor: colors.primary[500], p: 2, borderRadius: '4px' }}>
            <Typography variant="body2" color={colors.grey[300]}>
              Use the tabs above to focus on specific metrics.
            </Typography>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default LineChart;