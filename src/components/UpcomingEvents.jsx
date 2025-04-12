import { Box, Typography, useTheme, CircularProgress } from "@mui/material";
import { tokens } from "../theme";
import { useState, useEffect } from "react";
import axios from "axios";
import { formatDate } from "@fullcalendar/core";
import EventIcon from "@mui/icons-material/Event";

const API_URL = "http://localhost:5000/api/calendar";

const UpcomingEvents = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await axios.get(API_URL);
        
        // Transform the response data
        const formattedEvents = response.data.map(event => ({
          id: event.id.toString(),
          title: event.title,
          start: new Date(event.start_date),
          end: new Date(event.end_date),
          allDay: event.all_day
        }));
        
        // Sort by start date (ascending) and get only upcoming events
        const now = new Date();
        const upcomingEvents = formattedEvents
          .filter(event => event.start >= now)
          .sort((a, b) => a.start - b.start)
          .slice(0, 5); // Get only next 5 events
        
        setEvents(upcomingEvents);
        setError(null);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load upcoming events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Format the time for display
  const formatEventTime = (date, allDay) => {
    if (allDay) return 'All day';
    
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Get relative date display (Today, Tomorrow, or the date)
  const getRelativeDateDisplay = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return formatDate(date, {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <Box height="100%">
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="h5" fontWeight="600">
          Upcoming Events
        </Typography>
        <EventIcon color="action" />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="80%">
          <CircularProgress size={24} color="secondary" />
        </Box>
      ) : error ? (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="80%"
          color={colors.redAccent[500]}
        >
          <Typography>{error}</Typography>
        </Box>
      ) : events.length === 0 ? (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="80%"
          color={colors.grey[400]}
        >
          <Typography>No upcoming events</Typography>
        </Box>
      ) : (
        <Box sx={{ overflowY: 'auto', height: 'calc(100% - 40px)' }}>
          {events.map((event) => (
            <Box
              key={event.id}
              sx={{
                display: 'flex',
                borderLeft: `4px solid ${colors.greenAccent[500]}`,
                backgroundColor: colors.primary[500],
                mb: 1.5,
                borderRadius: '0 4px 4px 0',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  backgroundColor: colors.primary[400],
                  boxShadow: `0 4px 8px rgba(0, 0, 0, 0.15)`
                }
              }}
            >
              <Box 
                sx={{ 
                  width: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primary[600],
                  p: 1
                }}
              >
                <Typography 
                  variant="h3" 
                  sx={{ 
                    lineHeight: 1,
                    fontWeight: 'bold',
                    fontSize: '1.5rem'
                  }}
                >
                  {event.start.getDate()}
                </Typography>
                <Typography variant="caption" sx={{ textTransform: 'uppercase' }}>
                  {event.start.toLocaleString('default', { month: 'short' })}
                </Typography>
              </Box>
              
              <Box p={1.5} width="calc(100% - 60px)">
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 'bold',
                    mb: 0.5,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {event.title}
                </Typography>
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption" color={colors.greenAccent[400]}>
                    {getRelativeDateDisplay(event.start)}
                  </Typography>
                  <Typography variant="caption" color={colors.grey[300]}>
                    {formatEventTime(event.start, event.allDay)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default UpcomingEvents;