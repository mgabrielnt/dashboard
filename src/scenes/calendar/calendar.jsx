import { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import { formatDate } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  IconButton,
  Paper,
  Fab,
  Tooltip,
  Zoom,
  Snackbar,
  Alert,
  Chip,
  Avatar,
  Badge,
  CircularProgress,
  Collapse,
  Card,
  CardContent,
} from "@mui/material";
import { tokens } from "../../theme";
import axios from "axios";
import AddIcon from "@mui/icons-material/Add";
import EventIcon from "@mui/icons-material/Event";
import CloseIcon from "@mui/icons-material/Close";
import TodayIcon from "@mui/icons-material/Today";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
// No need for framer-motion

// API base URL
const API_URL = "http://localhost:5000/api/calendar";

const Calendar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const calendarRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // State for add/edit dialog
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // "add" or "edit"
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventAllDay, setEventAllDay] = useState(false);
  const [eventDescription, setEventDescription] = useState("");
  const [eventColor, setEventColor] = useState("#3788d8"); // Default blue color

  // Color options for events
  const colorOptions = [
    { name: "Blue", value: "#3788d8" },
    { name: "Green", value: "#2ecc71" },
    { name: "Purple", value: "#9b59b6" },
    { name: "Red", value: "#e74c3c" },
    { name: "Orange", value: "#f39c12" },
    { name: "Teal", value: "#1abc9c" }
  ];

  // Fetch events from backend
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      
      // Transform the response data to match FullCalendar event format
      const formattedEvents = response.data.map(event => ({
        id: event.id.toString(), // Ensure id is a string
        title: event.title,
        start: event.start_date,
        end: event.end_date,
        allDay: event.all_day,
        description: event.description || "",
        backgroundColor: event.color || "#3788d8",
        borderColor: event.color || "#3788d8"
      }));
      
      setCurrentEvents(formattedEvents);
      setSnackbar({
        open: true,
        message: "Events loaded successfully",
        severity: "success"
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      setSnackbar({
        open: true,
        message: "Failed to load events",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (selected) => {
    // Open dialog in add mode
    setDialogMode("add");
    setEventTitle("");
    setEventStart(selected.startStr);
    setEventEnd(selected.endStr);
    setEventAllDay(selected.allDay);
    setEventDescription("");
    setEventColor("#3788d8");
    setOpenEventDialog(true);
  };

  const handleAddEvent = async () => {
    if (!eventTitle.trim()) {
      setSnackbar({
        open: true,
        message: "Please enter an event title",
        severity: "warning"
      });
      return;
    }
    
    try {
      // Create new event in the backend
      const response = await axios.post(API_URL, {
        title: eventTitle,
        start: eventStart,
        end: eventEnd,
        allDay: eventAllDay,
        description: eventDescription,
        color: eventColor
      });

      // Add the new event to the state
      const newEvent = {
        id: response.data.id.toString(),
        title: eventTitle,
        start: eventStart,
        end: eventEnd,
        allDay: eventAllDay,
        description: eventDescription,
        backgroundColor: eventColor,
        borderColor: eventColor
      };
      
      setCurrentEvents(prev => [...prev, newEvent]);
      
      // Get the calendar API safely
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.unselect(); // Clear selection
      }
      
      setSnackbar({
        open: true,
        message: "Event created successfully",
        severity: "success"
      });
      
      // Close the dialog
      setOpenEventDialog(false);
    } catch (error) {
      console.error("Error creating event:", error);
      setSnackbar({
        open: true,
        message: "Failed to create event",
        severity: "error"
      });
    }
  };

  const handleEventClick = (clickInfo) => {
    // Open dialog in edit mode
    const event = clickInfo.event;
    setDialogMode("edit");
    setSelectedEvent(event);
    setEventTitle(event.title);
    setEventStart(formatDateForInput(event.start));
    setEventEnd(event.end ? formatDateForInput(event.end) : formatDateForInput(event.start));
    setEventAllDay(event.allDay);
    setEventDescription(event.extendedProps.description || "");
    setEventColor(event.backgroundColor || "#3788d8");
    setOpenEventDialog(true);
  };

  // Format date for datetime-local input
  const formatDateForInput = (date) => {
    if (!date) return "";
    const localDate = new Date(date);
    return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const handleCloseEventDialog = () => {
    setOpenEventDialog(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      // Delete the event from the backend
      await axios.delete(`${API_URL}/${selectedEvent.id}`);
      
      // Remove the event from state
      setCurrentEvents(prev => 
        prev.filter(event => event.id !== selectedEvent.id)
      );
      
      // Remove from calendar
      selectedEvent.remove();
      
      setSnackbar({
        open: true,
        message: "Event deleted successfully",
        severity: "success"
      });
      
      // Close the dialog
      handleCloseEventDialog();
    } catch (error) {
      console.error("Error deleting event:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete event",
        severity: "error"
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedEvent || !eventTitle.trim()) return;
    
    try {
      // Create the updated event object
      const updatedEvent = {
        title: eventTitle,
        start: eventStart,
        end: eventEnd,
        allDay: eventAllDay,
        description: eventDescription,
        color: eventColor
      };
      
      // Update the event in the backend
      await axios.put(`${API_URL}/${selectedEvent.id}`, updatedEvent);
      
      // Update the event in the calendar
      selectedEvent.setProp('title', eventTitle);
      selectedEvent.setStart(eventStart);
      selectedEvent.setEnd(eventEnd);
      selectedEvent.setAllDay(eventAllDay);
      selectedEvent.setExtendedProp('description', eventDescription);
      selectedEvent.setProp('backgroundColor', eventColor);
      selectedEvent.setProp('borderColor', eventColor);
      
      // Update in the state
      setCurrentEvents(prev => 
        prev.map(event => 
          event.id === selectedEvent.id 
            ? {
                ...event,
                title: eventTitle,
                start: eventStart,
                end: eventEnd,
                allDay: eventAllDay,
                description: eventDescription,
                backgroundColor: eventColor,
                borderColor: eventColor
              }
            : event
        )
      );
      
      setSnackbar({
        open: true,
        message: "Event updated successfully",
        severity: "success"
      });
      
      // Close the dialog
      handleCloseEventDialog();
    } catch (error) {
      console.error("Error updating event:", error);
      setSnackbar({
        open: true,
        message: "Failed to update event",
        severity: "error"
      });
    }
  };

  const handleEventChange = async (changeInfo) => {
    try {
      const event = changeInfo.event;
      
      // Update the event in the backend
      await axios.put(`${API_URL}/${event.id}`, {
        title: event.title,
        start: event.startStr,
        end: event.endStr || event.startStr, // Ensure end is never null
        allDay: event.allDay,
        description: event.extendedProps.description || "",
        color: event.backgroundColor || "#3788d8"
      });
      
      // Update the event in state
      setCurrentEvents(prev => 
        prev.map(e => 
          e.id === event.id 
            ? {
                ...e,
                title: event.title,
                start: event.startStr,
                end: event.endStr || event.startStr,
                allDay: event.allDay,
                description: event.extendedProps.description || "",
                backgroundColor: event.backgroundColor || "#3788d8",
                borderColor: event.backgroundColor || "#3788d8"
              }
            : e
        )
      );
      
      setSnackbar({
        open: true,
        message: "Event updated successfully",
        severity: "success"
      });
    } catch (error) {
      console.error("Error updating event:", error);
      setSnackbar({
        open: true,
        message: "Failed to update event",
        severity: "error"
      });
      changeInfo.revert();
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Get today's events
  const todayEvents = currentEvents.filter(event => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventStart = new Date(event.start);
    eventStart.setHours(0, 0, 0, 0);
    
    return eventStart.getTime() === today.getTime();
  });

  return (
    <Box 
      sx={{ 
        p: "20px", 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column",
        background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[400]} 100%)`,
        borderRadius: "12px",
        boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.15)"
      }}
    >
      {/* Title Area */}
      <Box 
        sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          mb: 2
        }}
      >
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: "bold", 
            color: colors.grey[100],
            textShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)"
          }}
        >
          <EventIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Interactive Calendar
        </Typography>
        
        <Box>
          <Tooltip title="Refresh Calendar">
            <IconButton 
              onClick={fetchEvents}
              sx={{ color: colors.grey[100] }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}>
            <IconButton 
              onClick={toggleSidebar}
              sx={{ color: colors.grey[100] }}
            >
              <ArrowDropDownIcon 
                sx={{ 
                  transform: sidebarOpen ? "rotate(-90deg)" : "rotate(0deg)",
                  transition: "transform 0.3s"
                }} 
              />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box 
        sx={{ 
          display: "flex", 
          gap: 2, 
          height: "calc(100% - 60px)",
          flexGrow: 1,
          overflow: "hidden"
        }}
      >
        {/* CALENDAR SIDEBAR */}
        <Collapse 
          in={sidebarOpen} 
          orientation="horizontal"
          sx={{ width: sidebarOpen ? "25%" : "0%" }}
        >
          <Paper
            sx={{
              backgroundColor: colors.primary[400],
              borderRadius: "10px",
              height: "100%",
              p: 3,
              overflow: "hidden auto",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)"
            }}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 2, 
                display: "flex", 
                alignItems: "center",
                color: colors.greenAccent[400],
                fontWeight: "bold"
              }}
            >
              <TodayIcon sx={{ mr: 1 }} /> Today's Events
              <Chip 
                label={todayEvents.length} 
                size="small" 
                color="primary" 
                sx={{ ml: 1 }} 
              />
            </Typography>
            
            {todayEvents.length > 0 ? (
              <List>
                {todayEvents.map((event) => (
                  <ListItem

                    key={event.id}
                    sx={{
                      backgroundColor: event.backgroundColor || colors.greenAccent[500],
                      margin: "10px 0",
                      borderRadius: "8px",
                      boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
                      transition: "all 0.2s",
                      "&:hover": {
                        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="h6" sx={{ color: "#fff", fontWeight: "bold" }}>
                          {event.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography sx={{ display: "flex", alignItems: "center", color: "rgba(255,255,255,0.8)" }}>
                            <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            {event.allDay ? 'All day' : formatDate(event.start, {
                              hour: "numeric",
                              minute: "2-digit",
                              meridiem: true
                            })}
                          </Typography>
                          {event.description && (
                            <Typography sx={{ color: "rgba(255,255,255,0.7)", mt: 0.5, fontSize: "0.85rem" }}>
                              {event.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Card sx={{ backgroundColor: colors.primary[500], mt: 2 }}>
                <CardContent>
                  <Typography sx={{ textAlign: "center", color: colors.grey[300] }}>
                    No events scheduled for today
                  </Typography>
                </CardContent>
              </Card>
            )}

            <Typography 
              variant="h5" 
              sx={{ 
                mt: 4, 
                mb: 2, 
                display: "flex", 
                alignItems: "center",
                color: colors.greenAccent[400],
                fontWeight: "bold"
              }}
            >
              <EventIcon sx={{ mr: 1 }} /> Upcoming Events
              <Chip 
                label={currentEvents.length} 
                size="small" 
                color="primary" 
                sx={{ ml: 1 }} 
              />
            </Typography>
            
            {currentEvents.length > 0 ? (
              <List sx={{ maxHeight: "400px", overflow: "auto" }}>
                {currentEvents.slice(0, 5).map((event) => (
                  <ListItem

                    key={event.id}
                    sx={{
                      backgroundColor: event.backgroundColor || colors.greenAccent[500],
                      margin: "10px 0",
                      borderRadius: "8px",
                      boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
                      transition: "all 0.2s",
                      "&:hover": {
                        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="h6" sx={{ color: "#fff", fontWeight: "bold" }}>
                          {event.title}
                        </Typography>
                      }
                      secondary={
                        <Typography sx={{ color: "rgba(255,255,255,0.8)" }}>
                          {formatDate(event.start, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
                {currentEvents.length > 5 && (
                  <Typography 
                    sx={{ 
                      mt: 2, 
                      textAlign: "center", 
                      color: colors.grey[300],
                      fontSize: "0.9rem"
                    }}
                  >
                    +{currentEvents.length - 5} more events
                  </Typography>
                )}
              </List>
            ) : (
              <Card sx={{ backgroundColor: colors.primary[500], mt: 2 }}>
                <CardContent>
                  <Typography sx={{ textAlign: "center", color: colors.grey[300] }}>
                    No upcoming events
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Paper>
        </Collapse>

        {/* CALENDAR */}
        <Paper
          sx={{
            flex: "1 1 auto",
            borderRadius: "10px",
            p: 2,
            backgroundColor: colors.primary[400],
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {loading ? (
            <Box 
              sx={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center",
                height: "100%" 
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <FullCalendar
              ref={calendarRef}
              height="100%"
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                interactionPlugin,
                listPlugin,
              ]}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
              }}
              initialView="dayGridMonth"
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              select={handleDateClick}
              eventClick={handleEventClick}
              eventChange={handleEventChange}
              events={currentEvents}
              eventContent={(eventInfo) => {
                return (
                  <Tooltip title={eventInfo.event.extendedProps.description || eventInfo.event.title}>
                    <Box
                      sx={{
                        p: "2px 4px",
                        borderRadius: "4px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        backgroundColor: eventInfo.backgroundColor,
                        height: "100%",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      <Typography variant="body2" sx={{ color: "#fff" }}>
                        {eventInfo.timeText && (
                          <span style={{ marginRight: "4px" }}>{eventInfo.timeText}</span>
                        )}
                        {eventInfo.event.title}
                      </Typography>
                    </Box>
                  </Tooltip>
                );
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false
              }}
            />
          )}
          
          {/* Floating action button for adding new event */}
          <Zoom in={!loading}>
            <Fab
              color="primary"
              aria-label="add"
              sx={{
                position: "absolute",
                bottom: 20,
                right: 20,
                bgcolor: colors.greenAccent[500],
                "&:hover": {
                  bgcolor: colors.greenAccent[400]
                }
              }}
              onClick={() => {
                const today = new Date();
                setDialogMode("add");
                setEventTitle("");
                setEventStart(formatDateForInput(today));
                setEventEnd(formatDateForInput(today));
                setEventAllDay(false);
                setEventDescription("");
                setEventColor("#3788d8");
                setOpenEventDialog(true);
              }}
            >
              <AddIcon />
            </Fab>
          </Zoom>
        </Paper>
      </Box>

      {/* Event Dialog */}
      <Dialog 
        open={openEventDialog} 
        onClose={handleCloseEventDialog}

        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: colors.primary[400], color: colors.grey[100] }}>
          {dialogMode === "add" ? "Add New Event" : "Edit Event"}
          <IconButton
            aria-label="close"
            onClick={handleCloseEventDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: colors.grey[300],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: colors.primary[400], pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Event Title"
            type="text"
            fullWidth
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            sx={{ mb: 2 }}
            InputLabelProps={{
              style: { color: colors.grey[300] }
            }}
            InputProps={{
              style: { color: colors.grey[100] }
            }}
          />
          <TextField
            label="Description"
            multiline
            rows={3}
            fullWidth
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            sx={{ mb: 2 }}
            InputLabelProps={{
              style: { color: colors.grey[300] }
            }}
            InputProps={{
              style: { color: colors.grey[100] }
            }}
          />
          <TextField
            margin="dense"
            label="Start Date"
            type="datetime-local"
            fullWidth
            value={eventStart}
            onChange={(e) => setEventStart(e.target.value)}
            InputLabelProps={{
              shrink: true,
              style: { color: colors.grey[300] }
            }}
            InputProps={{
              style: { color: colors.grey[100] }
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="End Date"
            type="datetime-local"
            fullWidth
            value={eventEnd}
            onChange={(e) => setEventEnd(e.target.value)}
            InputLabelProps={{
              shrink: true,
              style: { color: colors.grey[300] }
            }}
            InputProps={{
              style: { color: colors.grey[100] }
            }}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={eventAllDay}
                onChange={(e) => setEventAllDay(e.target.checked)}
              />
            }
            label="All Day Event"
            sx={{ color: colors.grey[100], mb: 2 }}
          />
          
          <Typography variant="subtitle1" sx={{ color: colors.grey[100], mb: 1 }}>
            Event Color
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            {colorOptions.map((color) => (
              <Tooltip title={color.name} key={color.value}>
                <Box
                  onClick={() => setEventColor(color.value)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: color.value,
                    cursor: "pointer",
                    border: eventColor === color.value ? "2px solid white" : "2px solid transparent",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "scale(1.1)"
                    }
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: colors.primary[400], p: 2 }}>
          {dialogMode === "edit" && (
            <Button 
              onClick={handleDeleteEvent} 
              color="error"
              variant="contained"
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          )}
          <Button 
            onClick={handleCloseEventDialog}
            variant="outlined"
            sx={{ color: colors.grey[100], borderColor: colors.grey[100] }}
          >
            Cancel
          </Button>
          <Button 
            onClick={dialogMode === "add" ? handleAddEvent : handleSaveEdit} 
            color="primary"
            variant="contained"
            startIcon={dialogMode === "add" ? <AddIcon /> : <EditIcon />}
          >
            {dialogMode === "add" ? "Add Event" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Calendar;