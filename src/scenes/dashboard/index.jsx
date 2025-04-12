import { Box, Button, IconButton, Typography, useTheme, CircularProgress, Badge, Tooltip } from "@mui/material";
import { tokens } from "../../theme";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import FactCheckIcon from "@mui/icons-material/FactCheck"; // BKI icon
import AccountBalanceIcon from "@mui/icons-material/AccountBalance"; // SCI icon
import BusinessIcon from "@mui/icons-material/Business"; // SI icon
import DataThresholdingIcon from "@mui/icons-material/DataThresholding"; // Konsol icon
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CloseIcon from "@mui/icons-material/Close";
import React, { useState, useCallback, lazy, Suspense, useRef, useEffect } from 'react';
import axios from "axios";
import StatBox from "../../components/StatBox";
import CompactTimeRangeSelector from "../../components/CompactTimeRangeSelector";
import UpcomingEvents from "../../components/UpcomingEvents";
import html2pdf from 'html2pdf.js';

// Import LineChart directly instead of lazy loading to avoid issues
import LineChart from "../../components/LineChart";

// Lazy load other chart components
const GeographyChart = lazy(() => import("../../components/GeographyChart"));
const BarbkiChart = lazy(() => import("../../components/BarbkiChart"));
const BarsciChart = lazy(() => import("../../components/BarsciChart"));
const BarsiChart = lazy(() => import("../../components/BarsiChart"));
const PieChart = lazy(() => import("../../components/PieChart"));

// Chart loading placeholder component
const ChartLoadingPlaceholder = React.memo(() => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <Box 
      width="100%" 
      height="250px" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      backgroundColor={colors.primary[500]}
      opacity="0.7"
    >
      <CircularProgress size={40} color="secondary" />
      <Typography variant="h5" color={colors.grey[100]} ml={2}>
        Loading chart...
      </Typography>
    </Box>
  );
});

// Enhanced Calendar Button component
const CalendarButton = ({ onClick, eventCount = 0, isActive }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <Badge
      badgeContent={eventCount > 0 ? eventCount : null}
      color="error"
      overlap="circular"
      sx={{
        '& .MuiBadge-badge': {
          backgroundColor: colors.redAccent[500],
          color: colors.grey[900],
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }
      }}
    >
      <IconButton
        onClick={onClick}
        sx={{
          backgroundColor: isActive ? colors.blueAccent[600] : colors.primary[600],
          borderRadius: "50%",
          width: "42px",
          height: "42px",
          color: colors.grey[100],
          transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          "&:hover": {
            backgroundColor: colors.blueAccent[500],
            transform: "rotate(10deg) scale(1.1)",
            boxShadow: `0 6px 12px rgba(0, 0, 0, 0.25)`
          },
          animation: isActive ? "float 3s ease-in-out infinite" : "none",
          "@keyframes float": {
            "0%": { transform: "translateY(0) rotate(0deg)" },
            "50%": { transform: "translateY(-5px) rotate(5deg)" },
            "100%": { transform: "translateY(0) rotate(0deg)" }
          }
        }}
      >
        <CalendarTodayIcon 
          sx={{ 
            fontSize: "20px",
            animation: isActive ? "pulse 1.5s infinite" : "none",
            "@keyframes pulse": {
              "0%": { transform: "scale(1)" },
              "50%": { transform: "scale(1.2)" },
              "100%": { transform: "scale(1)" }
            }
          }} 
        />
      </IconButton>
    </Badge>
  );
};

// Memoized StatBox component
const MemoizedStatBox = React.memo(StatBox);

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const dashboardRef = useRef(null);
  const chartRefs = useRef({});
  const [isExporting, setIsExporting] = useState(false);
  const [zoomedBoxId, setZoomedBoxId] = useState(null);
  const [showUpcomingEvents, setShowUpcomingEvents] = useState(false);
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(true);
  const [upcomingEventCount, setUpcomingEventCount] = useState(0);
  const [entityStats, setEntityStats] = useState({
    bki: { value: 0, increase: "+0%", progress: "0.5" },
    sci: { value: 0, increase: "+0%", progress: "0.5" },
    si: { value: 0, increase: "+0%", progress: "0.5" },
    konsol: { value: 0, increase: "+0%", progress: "0.5" }
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Time range state
  const [appliedTimeRange, setAppliedTimeRange] = useState({
    type: 'custom',
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    startYear: new Date().getFullYear() - 1,
    startMonth: 1,
    endYear: new Date().getFullYear(),
    endMonth: 12
  });

  // Format date for database queries
  const formatDateForDb = useCallback((date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Fetch event count for badge display
  useEffect(() => {
    const fetchEventCount = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/calendar/count");
        if (response.data && response.data.count) {
          setUpcomingEventCount(response.data.count);
        }
      } catch (error) {
        console.error("Error fetching event count:", error);
      }
    };
    
    fetchEventCount();
    const intervalId = setInterval(fetchEventCount, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Fetch entity stats
  useEffect(() => {
    const fetchEntityStats = async () => {
      try {
        setIsLoadingStats(true);
        
        // Include date range parameters if available
        let params = {};
        if (appliedTimeRange.startDateStr && appliedTimeRange.endDateStr) {
          params = {
            startDate: appliedTimeRange.startDateStr,
            endDate: appliedTimeRange.endDateStr
          };
        }
        
        const response = await axios.get("http://localhost:5000/api/entities/totals-with-trends", { params });
        
        if (response.data) {
          setEntityStats(response.data);
        }
      } catch (error) {
        console.error("Error fetching entity stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };
    
    // Only fetch if we have valid date ranges
    if (appliedTimeRange.startDate && appliedTimeRange.endDate) {
      fetchEntityStats();
    }
  }, [appliedTimeRange]);

  // Fetch available periods from database
  useEffect(() => {
    const fetchAvailablePeriods = async () => {
      try {
        setIsLoadingPeriods(true);
        const response = await axios.get("http://localhost:5000/api/line/available-periods");
        
        if (response.data && response.data.length > 0) {
          setAvailablePeriods(response.data);
          
          // Use the FIRST YEAR data as requested
          const firstYearPeriod = response.data[0];
          const firstYear = Number(firstYearPeriod.year);
          
          // Get all months available in the first year
          const availableMonths = firstYearPeriod.available_months.map(Number);
          availableMonths.sort((a, b) => a - b);
          const firstMonth = availableMonths[0];
          const lastMonth = availableMonths[availableMonths.length - 1];
          
          // Create date range
          const startDate = new Date(firstYear, firstMonth - 1, 1);
          const lastDayOfMonth = new Date(firstYear, lastMonth, 0).getDate();
          const endDate = new Date(firstYear, lastMonth - 1, lastDayOfMonth);
          
          // Update time range state
          setAppliedTimeRange({
            type: 'custom',
            startDate,
            endDate,
            startYear: firstYear,
            startMonth: firstMonth,
            endYear: firstYear,
            endMonth: lastMonth,
            startDateStr: formatDateForDb(startDate),
            endDateStr: formatDateForDb(endDate)
          });
        }
      } catch (error) {
        console.error("Error fetching available periods:", error);
      } finally {
        setIsLoadingPeriods(false);
      }
    };
    
    fetchAvailablePeriods();
  }, [formatDateForDb]);

  // Time range change handler
  const handleTimeRangeChange = useCallback(async (newTimeRange) => {
    // Ensure we have a complete time range object
    let completeTimeRange = {
      ...newTimeRange,
      startDate: newTimeRange.startDate || new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: newTimeRange.endDate || new Date()
    };
    
    // Add formatted date strings for API use
    if (!completeTimeRange.startDateStr) {
      completeTimeRange.startDateStr = formatDateForDb(completeTimeRange.startDate);
    }
    
    if (!completeTimeRange.endDateStr) {
      completeTimeRange.endDateStr = formatDateForDb(completeTimeRange.endDate);
    }
    
    // Update state with time range
    setAppliedTimeRange(completeTimeRange);
    
    // Provide visual feedback
    const feedbackEl = document.createElement('div');
    feedbackEl.textContent = `Time range updated to: ${completeTimeRange.type}`;
    feedbackEl.style.position = 'fixed';
    feedbackEl.style.bottom = '20px';
    feedbackEl.style.left = '50%';
    feedbackEl.style.transform = 'translateX(-50%)';
    feedbackEl.style.padding = '10px 20px';
    feedbackEl.style.backgroundColor = colors.greenAccent[600];
    feedbackEl.style.color = colors.grey[900];
    feedbackEl.style.borderRadius = '4px';
    feedbackEl.style.zIndex = '9999';
    feedbackEl.style.opacity = '0';
    feedbackEl.style.transition = 'opacity 0.3s ease';
    
    document.body.appendChild(feedbackEl);
    
    // Animate feedback
    setTimeout(() => { feedbackEl.style.opacity = '1'; }, 100);
    setTimeout(() => { 
      feedbackEl.style.opacity = '0'; 
      setTimeout(() => document.body.removeChild(feedbackEl), 300);
    }, 2000);
  }, [colors.greenAccent, colors.grey, formatDateForDb]);

  // Generate PDF from dashboard content
  const generatePDF = useCallback(() => {
    if (!dashboardRef.current || isExporting) return;

    setIsExporting(true);

    const dashboardContent = dashboardRef.current;
    const date = new Date().toISOString().slice(0, 10);
    const filename = `dashboard-report-${date}.pdf`;

    // Configure PDF options
    const options = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        windowHeight: Math.max(
          document.body.scrollHeight, 
          document.body.offsetHeight,
          dashboardContent.scrollHeight, 
          dashboardContent.offsetHeight
        )
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    // Generate PDF
    html2pdf()
      .set(options)
      .from(dashboardContent)
      .save()
      .then(() => {
        console.log("PDF generated successfully");
        setIsExporting(false);
      })
      .catch(error => {
        console.error("Error generating PDF:", error);
        setIsExporting(false);
      });
  }, [isExporting]);

  // Toggle upcoming events modal
  const toggleUpcomingEvents = useCallback((e) => {
    if (e) e.stopPropagation();
    setShowUpcomingEvents(prev => !prev);
  }, []);

  // Define entity stat boxes based on the fetched data
  const statBoxProps = [
    {
      id: "stat-box-bki",
      title: isLoadingStats ? "Loading..." : new Intl.NumberFormat().format(entityStats.bki.value),
      subtitle: "BKI Total",
      progress: entityStats.bki.progress,
      increase: entityStats.bki.increase,
      icon: <FactCheckIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />
    },
    {
      id: "stat-box-sci",
      title: isLoadingStats ? "Loading..." : new Intl.NumberFormat().format(entityStats.sci.value),
      subtitle: "SCI Total",
      progress: entityStats.sci.progress,
      increase: entityStats.sci.increase,
      icon: <AccountBalanceIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />
    },
    {
      id: "stat-box-si",
      title: isLoadingStats ? "Loading..." : new Intl.NumberFormat().format(entityStats.si.value),
      subtitle: "SI Total",
      progress: entityStats.si.progress,
      increase: entityStats.si.increase,
      icon: <BusinessIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />
    },
    {
      id: "stat-box-konsol",
      title: isLoadingStats ? "Loading..." : new Intl.NumberFormat().format(entityStats.konsol.value),
      subtitle: "KONSOL Total",
      progress: entityStats.konsol.progress,
      increase: entityStats.konsol.increase,
      icon: <DataThresholdingIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />
    }
  ];

  // Define chart boxes
  const chartBoxes = [
    {
      id: "revenue-chart",
      gridColumn: "span 8",
      gridRow: "span 2",
      title: "Revenue Generated",
      value: "$59,342.32",
      chartComponent: LineChart
    },
    {
      id: "sales-quantity-1",
      gridColumn: "span 4",
      gridRow: "span 2",
      title: "BKI Analysis",
      chartComponent: BarbkiChart
    },
    {
      id: "campaign-breakdown",
      gridColumn: "span 4",
      gridRow: "span 2",
      title: "Entity Distribution",
      chartComponent: PieChart
    },
    {
      id: "sales-quantity-2",
      gridColumn: "span 4",
      gridRow: "span 2",
      title: "SCI Analysis",
      chartComponent: BarsciChart
    },
    {
      id: "sales-quantity-3",
      gridColumn: "span 4",
      gridRow: "span 2",
      title: "SI Analysis",
      chartComponent: BarsiChart
    }
  ];

  // Handle click on a box to zoom it
  const handleBoxClick = useCallback((boxId, event) => {
    event.stopPropagation();
    setZoomedBoxId(boxId);
  }, []);

  // Handle click anywhere to close zoomed box
  const handleCloseZoom = useCallback(() => {
    setZoomedBoxId(null);
  }, []);
  
  // Handle download chart functionality
  const handleDownloadChart = useCallback((chartId) => {
    const chartElement = chartRefs.current[chartId];
    if (!chartElement) return;
    
    try {
      // Find SVG element
      const svg = chartElement.querySelector('svg');
      if (!svg) {
        console.error('SVG element not found');
        return;
      }
      
      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
      
      // Create link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `chart-${chartId}-${new Date().toISOString().slice(0, 10)}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error(`Error downloading chart ${chartId}:`, error);
      alert('Could not download chart. Please try again.');
    }
  }, []);

  // Render the zoomed box content
  const renderZoomedContent = useCallback(() => {
    // For stat boxes
    if (zoomedBoxId && zoomedBoxId.startsWith("stat-box")) {
      const statBox = statBoxProps.find(box => box.id === zoomedBoxId);
      if (!statBox) return null;
      
      return (
        <Box 
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            backgroundColor: colors.primary[400],
            borderRadius: "8px",
            position: "relative"
          }}
        >
          <Typography variant="h2" fontWeight="bold" mb={3}>
            {statBox.subtitle}
          </Typography>
          
          <Box sx={{ transform: "scale(2)", mb: 4 }}>
            <MemoizedStatBox {...statBox} />
          </Box>
          
        </Box>
      );
    }
    
    // For chart boxes
    const chartBox = chartBoxes.find(box => box.id === zoomedBoxId);
    if (!chartBox) return null;
    
    const ChartComponent = chartBox.chartComponent;
    
    return (
      <Box 
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "20px",
          backgroundColor: colors.primary[400],
          borderRadius: "8px"
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h3" fontWeight="bold">
            {chartBox.title}
          </Typography>
          
          {chartBox.value && (
            <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
              {chartBox.value}
            </Typography>
          )}
        </Box>
        
        <Box 
          flexGrow={1} 
          minHeight="400px"
          ref={(el) => chartRefs.current[`zoomed-${chartBox.id}`] = el}
        >
          <ChartComponent isDashboard={false} timeRange={appliedTimeRange} />
        </Box>
      </Box>
    );
  }, [zoomedBoxId, statBoxProps, chartBoxes, handleCloseZoom, colors.primary, colors.blueAccent, colors.greenAccent, appliedTimeRange]);

  // Create animated stat box
  const renderAnimatedStatBox = useCallback((props, index) => (
    <Box
      key={index}
      gridColumn="span 3"
      backgroundColor={colors.primary[400]}
      display="flex"
      alignItems="center"
      justifyContent="center"
      borderRadius="8px"
      sx={{ 
        cursor: "pointer",
        transition: "all 0.3s ease",
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
        "&:hover": { 
          transform: "translateY(-5px)",
          boxShadow: `0 8px 15px rgba(0, 0, 0, 0.2)` 
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "4px",
          height: "100%",
          background: `linear-gradient(to bottom, ${colors.greenAccent[500]}, ${colors.blueAccent[500]})`,
          opacity: 0.8,
        },
        "&:after": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle at 30% 30%, ${colors.primary[300]}08, transparent 60%)`,
          opacity: 0.7,
        }
      }}
      onClick={(e) => handleBoxClick(props.id, e)}
    >
      <Box sx={{ 
          zIndex: 1, 
          width: "100%", 
          height: "100%", 
          padding: "10px", 
          display: "flex", 
          alignItems: "center",
          justifyContent: "center" 
        }}>
        <MemoizedStatBox {...props} />
      </Box>
    </Box>
  ), [colors.primary, colors.blueAccent, colors.greenAccent, handleBoxClick]);

  // Create chart box with enhanced styling
  const renderChartBox = useCallback((chartBox) => {
    const ChartComponent = chartBox.chartComponent;
    
    return (
      <Box
        key={chartBox.id}
        gridColumn={chartBox.gridColumn}
        gridRow={chartBox.gridRow}
        backgroundColor={colors.primary[400]}
        borderRadius="8px"
        overflow="hidden"
        sx={{ 
          cursor: "pointer",
          transition: "all 0.3s ease",
          position: "relative",
          boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
          "&:hover": { 
            transform: "translateY(-5px)",
            boxShadow: `0 8px 15px rgba(0, 0, 0, 0.2)` 
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "4px",
            height: "100%",
            background: `linear-gradient(to bottom, ${colors.greenAccent[500]}, ${colors.blueAccent[500]})`,
            opacity: 0.8,
          }
        }}
        ref={(el) => chartRefs.current[chartBox.id] = el}
        onClick={(e) => handleBoxClick(chartBox.id, e)}
      >
        {chartBox.id === "revenue-chart" ? (
          <>
            <Box
              mt="25px"
              p="0 30px"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box>
                <Typography
                  variant="h5"
                  fontWeight="600"
                  color={colors.grey[100]}
                >
                  {chartBox.title}
                </Typography>
                <Typography
                  variant="h3"
                  fontWeight="bold"
                  color={colors.greenAccent[500]}
                >
                  {chartBox.value}
                </Typography>
              </Box>
            </Box>
            <Box 
              height="250px" 
              m="-20px 0 0 0" 
              display="flex" 
              justifyContent="center"
              alignItems="center"
              position="relative"
              zIndex="5"
            >
              {isLoadingPeriods ? (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                  <CircularProgress size={40} color="secondary" />
                  <Typography variant="body2" color={colors.grey[300]} mt={2}>
                    Loading chart data...
                  </Typography>
                </Box>
              ) : (
                <LineChart isDashboard={true} timeRange={appliedTimeRange} />
              )}
            </Box>
          </>
        ) : (
          <>
            <Typography 
              variant="h5" 
              fontWeight="600" 
              sx={{ 
                padding: "30px 30px 0 30px", 
                position: "relative",
                textAlign: "center",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: "-8px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "40px",
                  height: "3px",
                  backgroundColor: colors.greenAccent[500],
                  borderRadius: "2px"
                }
              }}
            >
              {chartBox.title}
            </Typography>
            <Box height="250px" mt="-20px" display="flex" justifyContent="center" alignItems="center">
              {isLoadingPeriods ? (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                  <CircularProgress size={40} color="secondary" />
                  <Typography variant="body2" color={colors.grey[300]} mt={2}>
                    Loading chart data...
                  </Typography>
                </Box>
              ) : (
                <Suspense fallback={<ChartLoadingPlaceholder />}>
                  <ChartComponent isDashboard={true} timeRange={appliedTimeRange} />
                </Suspense>
              )}
            </Box>
          </>
        )}
      </Box>
    );
  }, [colors.primary, colors.grey, colors.greenAccent, colors.blueAccent, handleBoxClick, isLoadingPeriods, appliedTimeRange]);

  return (
    <Box m="20px" ref={dashboardRef}>
      {/* HEADER - With Time Range and Calendar Icon */}
      <Box 
        display="flex" 
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        mb="20px"
      >
        {/* Left Side with Time Range and Calendar Icon */}
        <Box display="flex" alignItems="center" gap="15px">
          {/* Time Range Selector */}
          {!isLoadingPeriods ? (
            <CompactTimeRangeSelector 
              onTimeRangeChange={handleTimeRangeChange} 
              currentTimeRange={appliedTimeRange.type}
            />
          ) : (
            <Box
              sx={{
                width: '200px',
                height: '32px',
                backgroundColor: colors.primary[400],
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CircularProgress size={20} color="secondary" sx={{ mr: 1 }} />
              <Typography variant="caption" color={colors.grey[300]}>
                Loading time ranges...
              </Typography>
            </Box>
          )}
          
          {/* Enhanced Interactive Calendar Button */}
          <CalendarButton 
            onClick={toggleUpcomingEvents} 
            eventCount={upcomingEventCount} 
            isActive={showUpcomingEvents}
          />
          
          {/* If calendar is active, show a hint about upcoming events */}
          {upcomingEventCount > 0 && (
            <Box
              sx={{
                opacity: 0.9,
                maxWidth: '200px',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: colors.blueAccent[900],
                borderRadius: '16px',
                px: 1.5,
                py: 0.5,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 1,
                  backgroundColor: colors.blueAccent[800],
                  transform: 'translateX(3px)'
                }
              }}
              onClick={toggleUpcomingEvents}
            >
              <Typography variant="caption" fontWeight="bold" color={colors.grey[100]}>
                {upcomingEventCount} upcoming event{upcomingEventCount !== 1 ? 's' : ''}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Download Button */}
        <Button
          onClick={generatePDF}
          disabled={isExporting}
          size="small"
          sx={{
            backgroundColor: colors.blueAccent[700],
            color: colors.grey[100],
            fontSize: "13px",
            fontWeight: "bold",
            padding: "8px 16px",
            borderRadius: "6px",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: colors.blueAccent[800],
              transform: "translateY(-2px)",
              boxShadow: `0 4px 8px rgba(0, 0, 0, 0.2)`
            },
          }}
        >
          <DownloadOutlinedIcon sx={{ mr: "6px", fontSize: "18px" }} />
          {isExporting ? "Exporting..." : "Export PDF"}
        </Button>
      </Box>

      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="140px"
        gap="20px"
      >
        {/* StatBox Row - Entity Totals */}
        {statBoxProps.map((props, index) => renderAnimatedStatBox(props, index))}

        {/* Chart Boxes with enhanced styling */}
        {chartBoxes.map(chartBox => renderChartBox(chartBox))}
      </Box>

      {/* UPCOMING EVENTS MODAL */}
      {showUpcomingEvents && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(6px)",
            zIndex: 1500,
            opacity: 0,
            animation: 'fadeIn 0.3s forwards',
            '@keyframes fadeIn': {
              '0%': { opacity: 0 },
              '100%': { opacity: 1 }
            }
          }}
          onClick={() => setShowUpcomingEvents(false)}
        >
          <Box
            sx={{
              width: "450px",
              maxHeight: "85vh",
              backgroundColor: colors.primary[400],
              boxShadow: `0 15px 35px rgba(0, 0, 0, 0.4)`,
              borderRadius: "16px",
              overflow: "hidden",
              position: "relative",
              transform: 'scale(0.9)',
              opacity: 0,
              animation: 'zoomIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
              '@keyframes zoomIn': {
                '0%': { transform: 'scale(0.9)', opacity: 0 },
                '100%': { transform: 'scale(1)', opacity: 1 }
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient and icon */}
            <Box 
              sx={{ 
                position: "relative", 
                background: `linear-gradient(135deg, ${colors.greenAccent[700]}, ${colors.blueAccent[700]})`,
                padding: "24px 20px 20px 20px",
                borderBottom: `1px solid ${colors.grey[800]}`
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                <EventAvailableIcon 
                  sx={{ 
                    fontSize: 36, 
                    color: colors.grey[100], 
                    mr: 1.5,
                    animation: 'bounce 1.5s infinite',
                    '@keyframes bounce': {
                      '0%, 100%': { transform: 'translateY(0)' },
                      '50%': { transform: 'translateY(-8px)' }
                    }
                  }} 
                />
                <Typography 
                  variant="h3" 
                  color={colors.grey[100]} 
                  fontWeight="bold"
                  sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                >
                  Upcoming Events
                </Typography>
              </Box>
              
              {/* Close button */}
              <IconButton
                onClick={() => setShowUpcomingEvents(false)}
                sx={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: `${colors.grey[900]}66`,
                  color: colors.grey[100],
                  '&:hover': {
                    backgroundColor: colors.redAccent[700],
                    transform: 'rotate(90deg)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            
            {/* Events Content */}
            <Box 
              sx={{ 
                maxHeight: "calc(85vh - 100px)", 
                overflow: "auto", 
                padding: "0 15px",
                position: "relative",
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '30px',
                  background: `linear-gradient(to top, ${colors.primary[400]}, transparent)`,
                  pointerEvents: 'none',
                  zIndex: 10
                }
              }}
            >
              <UpcomingEvents />
            </Box>
            
            {/* Bottom action button */}
            <Box 
              sx={{ 
                padding: "15px 20px", 
                borderTop: `1px solid ${colors.grey[800]}`,
                display: 'flex',
                justifyContent: 'center',
                backgroundColor: colors.primary[500]
              }}
            >
              <Button
                variant="contained"
                onClick={() => setShowUpcomingEvents(false)}
                sx={{
                  backgroundColor: colors.blueAccent[600],
                  color: colors.grey[100],
                  '&:hover': {
                    backgroundColor: colors.blueAccent[700]
                  },
                  px: 4
                }}
              >
                Close
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* ZOOM MODAL - for expanded view of charts and statboxes */}
      {zoomedBoxId && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(5px)",
            zIndex: 1500,
            opacity: 0,
            animation: 'fadeIn 0.3s forwards',
            '@keyframes fadeIn': {
              '0%': { opacity: 0 },
              '100%': { opacity: 1 }
            }
          }}
          onClick={handleCloseZoom}
        >
          <Box
            sx={{
              width: "90%",
              height: "90%",
              maxWidth: "1600px",
              maxHeight: "900px",
              backgroundColor: `${colors.primary[400]}dd`,
              boxShadow: `0 0 25px ${colors.primary[500]}`,
              borderRadius: "12px",
              overflow: "auto",
              padding: "30px",
              position: "relative",
              transform: 'scale(0.9)',
              opacity: 0,
              animation: 'zoomIn 0.4s forwards',
              '@keyframes zoomIn': {
                '0%': { transform: 'scale(0.9)', opacity: 0 },
                '100%': { transform: 'scale(1)', opacity: 1 }
              },
              // Fix for SVG charts being cut off
              '& svg': {
                overflow: 'visible'
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Special container with padding to prevent content being cut off */}
            <Box sx={{ 
              position: 'relative', 
              width: '100%', 
              height: '100%', 
              paddingBottom: '120px',
              overflowY: 'auto'
            }}>
              {renderZoomedContent()}
            </Box>

            {/* Close button with animation */}
            <IconButton
              onClick={handleCloseZoom}
              sx={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                backgroundColor: colors.grey[800],
                color: colors.grey[100],
                '&:hover': {
                  backgroundColor: colors.blueAccent[800],
                  transform: 'rotate(90deg)'
                },
                transition: 'all 0.3s ease',
                zIndex: 1600
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            
            {/* Add a "CLOSE" button at the bottom for better usability */}
            <Box
              sx={{
                position: 'absolute',
                bottom: '15px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1600
              }}
            >
              <Button
                variant="contained"
                onClick={handleCloseZoom}
                sx={{
                  backgroundColor: colors.blueAccent[700],
                  color: colors.grey[100],
                  px: 4,
                  py: 1,
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: colors.blueAccent[800]
                  }
                }}
              >
                CLOSE
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default React.memo(Dashboard);