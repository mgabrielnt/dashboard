import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { mockTransactions } from "../../data/mockData";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EmailIcon from "@mui/icons-material/Email";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TrafficIcon from "@mui/icons-material/Traffic";
import React, { useState, useCallback, useMemo, lazy, Suspense, useRef } from 'react';
import Header from "../../components/Header";
import StatBox from "../../components/StatBox";
import ProgressCircle from "../../components/ProgressCircle";
import html2pdf from 'html2pdf.js';

// Lazy load chart components
const LineChart = lazy(() => import("../../components/LineChart"));
const GeographyChart = lazy(() => import("../../components/GeographyChart"));
const BarbkiChart = lazy(() => import("../../components/BarbkiChart"));
const BarsciChart = lazy(() => import("../../components/BarsciChart"));
const BarsiChart = lazy(() => import("../../components/BarsiChart"));
const PieChart = lazy(() => import("../../components/PieChart"));
const TimeRangeNavbar = lazy(() => import("../../components/TimeRangeNavbar"));

// Create a loading placeholder component
const ChartLoadingPlaceholder = () => {
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
      <Typography variant="h5" color={colors.grey[100]}>
        Loading chart...
      </Typography>
    </Box>
  );
};

// Memoized StatBox component to prevent unnecessary re-renders
const MemoizedStatBox = React.memo(StatBox);

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const dashboardRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [timeRangeData, setTimeRangeData] = useState({
    period: "Day",
    dateRange: "",
    startDate: new Date(),
    endDate: new Date()
  });

  // Use useCallback to memoize event handlers
  const handleTimeRangeChange = useCallback((data) => {
    setTimeRangeData(data);
    console.log("Time range changed:", data);
    // You can update your charts or data here based on the new time range
  }, []);

  // Memoize static data/values that don't need to be recalculated on every render
  const statBoxProps = useMemo(() => [
    {
      title: "12,361",
      subtitle: "Emails Sent",
      progress: "0.75",
      increase: "+14%",
      icon: <EmailIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />
    },
    {
      title: "431,225",
      subtitle: "Sales Obtained",
      progress: "0.50",
      increase: "+21%",
      icon: <PointOfSaleIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />
    },
    {
      title: "32,441",
      subtitle: "New Clients",
      progress: "0.30",
      increase: "+5%",
      icon: <PersonAddIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />
    },
    {
      title: "1,325,134",
      subtitle: "Traffic Received",
      progress: "0.80",
      increase: "+43%",
      icon: <TrafficIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />
    }
  ], [colors.greenAccent]);

  // Function to generate PDF from dashboard content
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
      html2canvas: { scale: 2, useCORS: true, logging: false },
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

  return (
    <Box m="20px" ref={dashboardRef}>
      {/* HEADER - With TimeRangeNavbar and Download button */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
        width="100%"
        mb="40px"
      >
        {/* Left side - TimeRangeNavbar */}
        <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
          <Suspense fallback={<Typography>Loading filters...</Typography>}>
            <TimeRangeNavbar onTimeRangeChange={handleTimeRangeChange} />
          </Suspense>
        </Box>

        {/* Right side - Download button */}
        <Box>
          <Button
            onClick={generatePDF}
            disabled={isExporting}
            sx={{
              backgroundColor: colors.blueAccent[700],
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
              "&:hover": {
                backgroundColor: colors.blueAccent[800],
              },
            }}
          >
            <DownloadOutlinedIcon sx={{ mr: "10px" }} />
            {isExporting ? "Generating PDF..." : "Download Reports"}
          </Button>
        </Box>
      </Box>

      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="140px"
        gap="20px"
      >
        {/* ROW 1 - StatBoxes */}
        {statBoxProps.map((props, index) => (
          <Box
            key={index}
            gridColumn="span 3"
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <MemoizedStatBox {...props} />
          </Box>
        ))}

        {/* ROW 2 */}
        <Box
          gridColumn="span 8"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
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
                Revenue Generated
              </Typography>
              <Typography
                variant="h3"
                fontWeight="bold"
                color={colors.greenAccent[500]}
              >
                $59,342.32
              </Typography>
            </Box>
            <Box>
              <IconButton>
                <DownloadOutlinedIcon
                  sx={{ fontSize: "26px", color: colors.greenAccent[500] }}
                />
              </IconButton>
            </Box>
          </Box>
          <Box height="250px" m="-20px 0 0 0">
            <Suspense fallback={<ChartLoadingPlaceholder />}>
              <LineChart isDashboard={true} />
            </Suspense>
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{ padding: "30px 30px 0 30px" }}
          >
            Sales Quantity
          </Typography>
          <Box height="250px" mt="-20px">
            <Suspense fallback={<ChartLoadingPlaceholder />}>
              <BarsciChart isDashboard={true} />
            </Suspense>
          </Box>
        </Box>

        {/* ROW 3 */}
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          p="30px"
        >
          <Typography variant="h5" fontWeight="600">
            Campaign Breakdown
          </Typography>
          <Box height="250px">
            <Suspense fallback={<ChartLoadingPlaceholder />}>
              <PieChart isDashboard={true} />
            </Suspense>
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{ padding: "30px 30px 0 30px" }}
          >
            Sales Quantity
          </Typography>
          <Box height="250px" mt="-20px">
            <Suspense fallback={<ChartLoadingPlaceholder />}>
              <BarsiChart isDashboard={true} />
            </Suspense>
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{ padding: "30px 30px 0 30px" }}
          >
            Sales Quantity
          </Typography>
          <Box height="250px" mt="-20px">
            <Suspense fallback={<ChartLoadingPlaceholder />}>
              <BarbkiChart isDashboard={true} />
            </Suspense>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(Dashboard);