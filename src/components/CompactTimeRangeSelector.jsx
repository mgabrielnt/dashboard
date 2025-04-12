import { Box, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, useTheme, Paper, Stack, IconButton, Divider, Slide } from "@mui/material";
import { tokens } from "../theme";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";
import CloseIcon from "@mui/icons-material/Close";
import EventNoteIcon from "@mui/icons-material/EventNote";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import React, { useState, useEffect, forwardRef } from 'react';
import axios from "axios";

// Slide transition for the dialog
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CompactTimeRangeSelector = ({ onTimeRangeChange, currentTimeRange }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  // Default to '24h' if currentTimeRange is null or undefined
  const initialTimeRange = currentTimeRange || '24h';
  
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStartDay, setSelectedStartDay] = useState(null);
  const [selectedEndDay, setSelectedEndDay] = useState(null);
  const [selectionMode, setSelectionMode] = useState('start'); // 'start' or 'end'
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Time range options with their details
  const timeOptions = [
    { value: '24h', label: '24h', icon: <AccessTimeIcon fontSize="small" /> },
    { value: '7d', label: '7d', icon: <ViewWeekIcon fontSize="small" /> },
    { value: '30d', label: '30d', icon: <CalendarMonthIcon fontSize="small" /> },
    { value: 'custom', label: 'Custom', icon: <CalendarTodayIcon fontSize="small" /> }
  ];

  // Fetch available periods from the backend
  useEffect(() => {
    const fetchAvailablePeriods = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("http://localhost:5000/api/line/available-periods");
        if (response.data && response.data.length > 0) {
          setAvailablePeriods(response.data);
          console.log("Available periods fetched:", response.data);
        }
      } catch (error) {
        console.error("Error fetching available periods:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailablePeriods();
  }, []);

  // Initialize activeTab and timeRange from currentTimeRange prop
  useEffect(() => {
    console.log("Initial currentTimeRange:", currentTimeRange);
    
    if (currentTimeRange) {
      // Find index of the current time range option
      const index = timeOptions.findIndex(option => option.value === currentTimeRange);
      if (index !== -1) {
        console.log("Setting initial activeTab to:", index);
        setActiveTab(index);
        setTimeRange(currentTimeRange);
        
        // Initialize dates based on the time range type if not custom
        if (currentTimeRange !== 'custom') {
          const end = new Date();
          let start = new Date();
          
          switch(currentTimeRange) {
            case '7d':
              start.setDate(end.getDate() - 7);
              break;
            case '30d':
              start.setDate(end.getDate() - 30);
              break;
            case '24h':
            default:
              start.setHours(end.getHours() - 24);
              break;
          }
          
          setStartDate(start);
          setEndDate(end);
        }
      }
    }
  }, []);

  // Keep track of currentTimeRange changes and update UI
  useEffect(() => {
    console.log("currentTimeRange changed to:", currentTimeRange);
    
    if (currentTimeRange && currentTimeRange !== timeRange) {
      setTimeRange(currentTimeRange);
      
      // Find index of the current time range option
      const index = timeOptions.findIndex(option => option.value === currentTimeRange);
      if (index !== -1) {
        console.log("Setting activeTab to:", index, "for timeRange:", currentTimeRange);
        setActiveTab(index);
      }
    }
  }, [currentTimeRange, timeOptions, timeRange]);

  // Initialize selected days when dialog opens
  useEffect(() => {
    if (customDialogOpen) {
      // Always initialize with current startDate/endDate values
      setSelectedStartDay(startDate);
      setSelectedEndDay(endDate);
      setCurrentMonth(new Date(startDate));
    }
  }, [customDialogOpen, startDate, endDate]);

  // Convert JS Date to database-friendly format (YYYY-MM-DD)
  const formatDateForDb = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle time range selection with database range validation
  const handleTimeRangeSelect = async (newTimeRange, index) => {
    console.log("Time range selected:", newTimeRange, index);
    
    setTimeRange(newTimeRange);
    setActiveTab(index);
    
    // Declare date variables at the beginning
    let currentEndDate, currentStartDate;
    
    if (newTimeRange === 'custom') {
      // Ensure we have initial selections when opening custom dialog
      if (!selectedStartDay) {
        setSelectedStartDay(startDate);
      }
      if (!selectedEndDay) {
        setSelectedEndDay(endDate);
      }
      setCustomDialogOpen(true);
      return; // Don't trigger time change until dialog is confirmed
    } 
    
    // Calculate actual date ranges based on the selected option
    currentEndDate = new Date(); // Current date/time
    currentStartDate = new Date();
    
    // Calculate the start date based on the selected time range
    switch(newTimeRange) {
      case '24h':
        currentStartDate.setHours(currentStartDate.getHours() - 24);
        break;
      case '7d':
        currentStartDate.setDate(currentStartDate.getDate() - 7);
        break;
      case '30d':
        currentStartDate.setDate(currentStartDate.getDate() - 30);
        break;
      default:
        // Default case (shouldn't be needed but good to have)
        currentStartDate.setDate(currentStartDate.getDate() - 1);
    }
    
    // Update internal state
    setStartDate(currentStartDate);
    setEndDate(currentEndDate);
    
    // Check if the selected range is valid with our available data
    try {
      const startYear = currentStartDate.getFullYear();
      const startMonth = currentStartDate.getMonth() + 1;
      const endYear = currentEndDate.getFullYear();
      const endMonth = currentEndDate.getMonth() + 1;
      
      // Find if the date range is valid based on available periods
      const isValidRange = availablePeriods.some(period => {
        const periodYear = Number(period.year);
        const availableMonths = period.available_months.map(Number);
        
        // If both dates fall within the same year
        if (startYear === endYear && startYear === periodYear) {
          return availableMonths.some(month => month >= startMonth && month <= endMonth);
        }
        
        // If dates span across years, check if any part of the range is available
        if (startYear === periodYear) {
          return availableMonths.some(month => month >= startMonth);
        }
        
        if (endYear === periodYear) {
          return availableMonths.some(month => month <= endMonth);
        }
        
        // If the period year is between start and end years
        if (periodYear > startYear && periodYear < endYear) {
          return availableMonths.length > 0;
        }
        
        return false;
      });
      
      if (!isValidRange && availablePeriods.length > 0) {
        // If invalid range, find the closest valid range
        const mostRecentPeriod = availablePeriods[availablePeriods.length - 1];
        const mostRecentYear = Number(mostRecentPeriod.year);
        const mostRecentMonth = Math.max(...mostRecentPeriod.available_months.map(Number));
        
        // Adjust end date to the most recent available data
        const adjustedEndDate = new Date(mostRecentYear, mostRecentMonth - 1, 
          Math.min(currentEndDate.getDate(), new Date(mostRecentYear, mostRecentMonth, 0).getDate()));
        
        // Adjust start date based on time range
        const adjustedStartDate = new Date(adjustedEndDate);
        switch(newTimeRange) {
          case '24h':
            adjustedStartDate.setHours(adjustedStartDate.getHours() - 24);
            break;
          case '7d':
            adjustedStartDate.setDate(adjustedStartDate.getDate() - 7);
            break;
          case '30d':
            adjustedStartDate.setDate(adjustedStartDate.getDate() - 30);
            break;
          default:
            adjustedStartDate.setDate(adjustedStartDate.getDate() - 1);
        }
        
        // Use adjusted dates
        currentStartDate = adjustedStartDate;
        currentEndDate = adjustedEndDate;
        
        // Update internal state with adjusted dates
        setStartDate(adjustedStartDate);
        setEndDate(adjustedEndDate);
        
        console.log("Adjusted to valid date range:", 
          formatDateForDb(adjustedStartDate), "to", formatDateForDb(adjustedEndDate));
      }
    } catch (error) {
      console.error("Error validating date range:", error);
    }
    
    // Now pass actual date objects to the parent component
    const rangeObj = {
      type: newTimeRange,
      startDate: currentStartDate,
      endDate: currentEndDate,
      startYear: currentStartDate.getFullYear(),
      startMonth: currentStartDate.getMonth() + 1,
      endYear: currentEndDate.getFullYear(),
      endMonth: currentEndDate.getMonth() + 1,
      // Add formatted date strings for direct API use
      startDateStr: formatDateForDb(currentStartDate),
      endDateStr: formatDateForDb(currentEndDate)
    };
    
    console.log("Sending range to parent:", rangeObj);
    onTimeRangeChange(rangeObj);
  };

  // Handle custom range application
  const handleCustomRangeApply = () => {
    // Use the selected days from the calendar
    if (selectedStartDay && selectedEndDay) {
      // Update internal state
      setStartDate(selectedStartDay);
      setEndDate(selectedEndDay);
      
      // Close the dialog
      setCustomDialogOpen(false);
      
      // Create the range object with additional properties for database query
      const rangeObj = {
        type: 'custom',
        startDate: selectedStartDay,
        endDate: selectedEndDay,
        startYear: selectedStartDay.getFullYear(),
        startMonth: selectedStartDay.getMonth() + 1,
        endYear: selectedEndDay.getFullYear(),
        endMonth: selectedEndDay.getMonth() + 1,
        // Add formatted date strings for direct API use
        startDateStr: formatDateForDb(selectedStartDay),
        endDateStr: formatDateForDb(selectedEndDay)
      };
      
      // Update active tab to reflect custom selection
      const customIndex = timeOptions.findIndex(option => option.value === 'custom');
      if (customIndex !== -1) {
        setActiveTab(customIndex);
      }
      
      console.log("Sending custom range to parent:", rangeObj);
      onTimeRangeChange(rangeObj);
    } else {
      console.error("Please select both start and end dates");
      // You could add a visual error message here
    }
  };

  // Navigate to previous month
  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() - 1);
      return newMonth;
    });
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + 1);
      return newMonth;
    });
  };

  // Jump to today's month
  const handleTodayMonth = () => {
    setCurrentMonth(new Date());
  };

  // Generate days for the current month view
  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    
    // Add previous month days to fill start of calendar
    const firstDay = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }
    
    // Add current month days
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Add next month days to fill end of calendar
    const lastDay = new Date(year, month, daysInMonth).getDay();
    const nextMonthDays = 6 - lastDay;
    
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  // Check if a day is available in the database
  const isDayAvailable = (day) => {
    if (!availablePeriods || availablePeriods.length === 0) return true;
    
    const year = day.date.getFullYear();
    const month = day.date.getMonth() + 1;
    
    return availablePeriods.some(period => {
      return Number(period.year) === year && 
             period.available_months.map(Number).includes(month);
    });
  };

  // Handle day selection in the calendar
  const handleDaySelect = (day) => {
    // Only allow selection of days that are available in the database
    if (!isDayAvailable(day)) {
      console.log("Selected day not available in database:", day.date);
      return;
    }
    
    if (selectionMode === 'start') {
      setSelectedStartDay(day.date);
      setSelectedEndDay(null);
      setSelectionMode('end');
    } else {
      // Ensure end date is after start date
      if (selectedStartDay && day.date >= selectedStartDay) {
        setSelectedEndDay(day.date);
      } else {
        // If user selects a date before start date, swap them
        setSelectedEndDay(selectedStartDay);
        setSelectedStartDay(day.date);
      }
      setSelectionMode('start');
    }
  };

  // Check if a day is in the selected range
  const isDayInRange = (day) => {
    if (!selectedStartDay || !selectedEndDay) return false;
    return day.date >= selectedStartDay && day.date <= selectedEndDay;
  };

  // Check if a day is the start or end of the range
  const isDayRangeEnd = (day) => {
    if (!selectedStartDay || !selectedEndDay) return false;
    
    return (
      day.date.getTime() === selectedStartDay.getTime() ||
      day.date.getTime() === selectedEndDay.getTime()
    );
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get days for current month view
  const days = getDaysInMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  // Week days header
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          backgroundColor: colors.primary[400],
          borderRadius: '6px',
          overflow: 'hidden',
          height: '32px'
        }}
      >
        {timeOptions.map((option, index) => (
          <Tooltip
            key={option.value}
            title={`View ${option.label === 'Custom' ? 'custom date range' : `last ${option.label}`}`}
            arrow
          >
            <Box
              onClick={() => handleTimeRangeSelect(option.value, index)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 10px',
                height: '100%',
                cursor: 'pointer',
                backgroundColor: activeTab === index ? colors.blueAccent[600] : 'transparent',
                color: activeTab === index ? colors.grey[100] : colors.grey[300],
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: activeTab === index ? colors.blueAccent[600] : colors.primary[500],
                  color: colors.grey[100]
                }
              }}
            >
              {option.icon}
              <Typography 
                variant="caption" 
                sx={{ 
                  ml: 0.5, 
                  fontWeight: activeTab === index ? 'bold' : 'normal' 
                }}
              >
                {option.label}
              </Typography>
            </Box>
          </Tooltip>
        ))}
      </Box>

      {/* Enhanced Custom Date Range Dialog */}
      <Dialog 
        open={customDialogOpen} 
        onClose={() => setCustomDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            backgroundColor: colors.primary[400],
            color: colors.grey[100],
            borderRadius: '10px',
            overflow: 'hidden',
            zIndex: 1500 // Increased z-index
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(90deg, ${colors.blueAccent[600]}, ${colors.blueAccent[800]})`,
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <EventNoteIcon />
            <Typography variant="h5">Select Date Range</Typography>
          </Box>
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={() => setCustomDialogOpen(false)}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ padding: '24px' }}>
          {/* Date range display */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 3,
              padding: '12px',
              backgroundColor: colors.primary[500],
              borderRadius: '8px'
            }}
          >
            <Box>
              <Typography variant="caption" color={colors.grey[300]}>Start Date</Typography>
              <Typography variant="h6" fontWeight="bold">
                {selectedStartDay ? formatDate(selectedStartDay) : 'Select start date'}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: colors.grey[400],
                px: 2
              }}
            >
              <KeyboardArrowRightIcon />
            </Box>
            <Box>
              <Typography variant="caption" color={colors.grey[300]}>End Date</Typography>
              <Typography variant="h6" fontWeight="bold">
                {selectedEndDay ? formatDate(selectedEndDay) : 'Select end date'}
              </Typography>
            </Box>
          </Box>
          
          {/* Calendar header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}
          >
            <IconButton onClick={handlePrevMonth} sx={{ color: colors.grey[300] }}>
              <ChevronLeftIcon />
            </IconButton>
            
            <Typography variant="h5">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Typography>
            
            <Box>
              <IconButton onClick={handleTodayMonth} sx={{ color: colors.grey[300], mr: 1 }}>
                <TodayIcon />
              </IconButton>
              <IconButton onClick={handleNextMonth} sx={{ color: colors.grey[300] }}>
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>
          
          {isLoading ? (
            <Typography variant="body1" textAlign="center" py={3}>
              Loading available dates...
            </Typography>
          ) : (
            /* Calendar grid */
            <Box sx={{ width: '100%' }}>
              {/* Week days header */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  textAlign: 'center',
                  mb: 1
                }}
              >
                {weekDays.map(day => (
                  <Typography 
                    key={day} 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: colors.grey[300]
                    }}
                  >
                    {day}
                  </Typography>
                ))}
              </Box>
              
              {/* Calendar days */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 0.5
                }}
              >
                {days.map((day, index) => {
                  const isToday = day.date.toDateString() === new Date().toDateString();
                  const isSelected = selectedStartDay && day.date.toDateString() === selectedStartDay.toDateString() ||
                                   selectedEndDay && day.date.toDateString() === selectedEndDay.toDateString();
                  const isInRange = isDayInRange(day);
                  const isRangeEnd = isDayRangeEnd(day);
                  const isAvailable = isDayAvailable(day);
                  
                  return (
                    <Box
                      key={index}
                      onClick={() => isAvailable && handleDaySelect(day)}
                      sx={{
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                        borderRadius: '4px',
                        position: 'relative',
                        backgroundColor: isSelected 
                          ? colors.blueAccent[600]
                          : isInRange 
                            ? `${colors.blueAccent[800]}80` // with transparency
                            : isToday
                              ? `${colors.greenAccent[700]}30` // with transparency
                              : 'transparent',
                        color: !day.isCurrentMonth 
                          ? colors.grey[500] 
                          : !isAvailable
                            ? colors.grey[700]
                            : isSelected || isRangeEnd
                              ? colors.grey[100]
                              : colors.grey[300],
                        transition: 'all 0.1s ease',
                        '&:hover': isAvailable ? {
                          backgroundColor: isSelected 
                            ? colors.blueAccent[700]
                            : colors.primary[500]
                        } : {},
                        // Highlight today's date
                        ...(isToday && {
                          border: `1px solid ${colors.greenAccent[500]}`,
                        }),
                        // Use ::before and ::after to create range start/end markers
                        ...(isSelected && {
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: '5px',
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: colors.grey[100]
                          }
                        }),
                        // Add visual indicator for unavailable dates
                        ...(!isAvailable && {
                          opacity: 0.5,
                          textDecoration: 'line-through'
                        })
                      }}
                    >
                      <Typography variant="body2">
                        {day.date.getDate()}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
          
          {/* Available periods info */}
          {availablePeriods.length > 0 && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                backgroundColor: colors.primary[600],
                borderRadius: '8px',
                border: `1px dashed ${colors.grey[500]}`
              }}
            >
              <Typography variant="caption" color={colors.grey[300]} display="block" gutterBottom>
                Available Data Periods:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availablePeriods.map((period, index) => (
                  <Tooltip 
                    key={index} 
                    title={`Available Months: ${period.available_months.map(Number).map(m => {
                      return new Date(0, m-1).toLocaleString('default', { month: 'short' });
                    }).join(', ')}`}
                    arrow
                  >
                    <Box
                      sx={{
                        backgroundColor: colors.primary[500],
                        color: colors.grey[200],
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '12px'
                      }}
                    >
                      {period.year}
                    </Box>
                  </Tooltip>
                ))}
              </Box>
            </Box>
          )}
          
          {/* Quick select options */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              mt: 3
            }}
          >
            {[
              { label: 'Today', days: 0 },
              { label: 'Last 3 days', days: 3 },
              { label: 'Last week', days: 7 },
              { label: 'Last 2 weeks', days: 14 },
              { label: 'Last month', days: 30 },
              { label: 'Last 3 months', days: 90 },
            ].map((option) => (
              <Button
                key={option.label}
                size="small"
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(end.getDate() - option.days);
                  setSelectedStartDay(start);
                  setSelectedEndDay(end);
                  setCurrentMonth(start);
                }}
                sx={{
                  backgroundColor: colors.primary[500],
                  color: colors.grey[200],
                  border: `1px solid ${colors.primary[300]}`,
                  '&:hover': {
                    backgroundColor: colors.primary[600]
                  }
                }}
              >
                {option.label}
              </Button>
            ))}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ padding: '16px 24px', borderTop: `1px solid ${colors.primary[500]}` }}>
          <Button 
            onClick={() => setCustomDialogOpen(false)}
            sx={{ 
              color: colors.grey[300],
              '&:hover': {
                backgroundColor: colors.primary[600]
              }
            }}
          >
            Cancel
          </Button>
          
          <Button 
            onClick={handleCustomRangeApply}
            variant="contained"
            disabled={!selectedStartDay || !selectedEndDay}
            sx={{ 
              backgroundColor: colors.blueAccent[700],
              color: colors.grey[100],
              "&:hover": {
                backgroundColor: colors.blueAccent[800]
              },
              padding: '8px 16px'
            }}
          >
            Apply Date Range
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CompactTimeRangeSelector;