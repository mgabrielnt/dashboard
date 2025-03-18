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
} from "@mui/material";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import axios from "axios";

// API base URL
const API_URL = "http://localhost:5000/api/calendar";

const Calendar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const calendarRef = useRef(null);
  
  // State for edit dialog
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editAllDay, setEditAllDay] = useState(false);

  // Fetch events from backend
  useEffect(() => {
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
          allDay: event.all_day
        }));
        
        setCurrentEvents(formattedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleDateClick = async (selected) => {
    const title = prompt("Please enter a new title for your event");
    
    if (!title) return; // Exit if no title provided
    
    try {
      // Create new event in the backend
      const response = await axios.post(API_URL, {
        title,
        start: selected.startStr,
        end: selected.endStr,
        allDay: selected.allDay
      });

      // Add the new event to the state
      setCurrentEvents(prev => [...prev, {
        id: response.data.id.toString(),
        title,
        start: selected.startStr,
        end: selected.endStr,
        allDay: selected.allDay
      }]);
      
      // Get the calendar API safely
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.unselect(); // Clear selection
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event. Please try again.");
    }
  };

  const handleEventClick = (clickInfo) => {
    // Open edit dialog instead of confirming deletion
    const event = clickInfo.event;
    setEditEvent(event);
    setEditTitle(event.title);
    setEditStart(formatDateForInput(event.start));
    setEditEnd(event.end ? formatDateForInput(event.end) : formatDateForInput(event.start));
    setEditAllDay(event.allDay);
    setOpenEditDialog(true);
  };

  // Format date for datetime-local input
  const formatDateForInput = (date) => {
    if (!date) return "";
    const localDate = new Date(date);
    return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditEvent(null);
  };

  const handleDeleteEvent = async () => {
    if (!editEvent) return;
    
    if (window.confirm(`Are you sure you want to delete the event '${editEvent.title}'`)) {
      try {
        // Delete the event from the backend
        await axios.delete(`${API_URL}/${editEvent.id}`);
        
        // Remove the event from state
        setCurrentEvents(prev => 
          prev.filter(event => event.id !== editEvent.id)
        );
        
        // Remove from calendar
        editEvent.remove();
        
        // Close the dialog
        handleCloseEditDialog();
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("Failed to delete event. Please try again.");
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editEvent) return;
    
    try {
      // Create the updated event object
      const updatedEvent = {
        title: editTitle,
        start: editStart,
        end: editEnd,
        allDay: editAllDay
      };
      
      // Update the event in the backend
      await axios.put(`${API_URL}/${editEvent.id}`, updatedEvent);
      
      // Update the event in the calendar
      editEvent.setProp('title', editTitle);
      editEvent.setStart(editStart);
      editEvent.setEnd(editEnd);
      editEvent.setAllDay(editAllDay);
      
      // Update in the state
      setCurrentEvents(prev => 
        prev.map(event => 
          event.id === editEvent.id 
            ? {
                ...event,
                title: editTitle,
                start: editStart,
                end: editEnd,
                allDay: editAllDay
              }
            : event
        )
      );
      
      // Close the dialog
      handleCloseEditDialog();
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Failed to update event. Please try again.");
    }
  };

  const handleEventChange = async (changeInfo) => {
    try {
      // Update the event in the backend
      await axios.put(`${API_URL}/${changeInfo.event.id}`, {
        title: changeInfo.event.title,
        start: changeInfo.event.startStr,
        end: changeInfo.event.endStr || changeInfo.event.startStr, // Ensure end is never null
        allDay: changeInfo.event.allDay
      });
      
      // Update the event in state
      setCurrentEvents(prev => 
        prev.map(event => 
          event.id === changeInfo.event.id 
            ? {
                ...event,
                title: changeInfo.event.title,
                start: changeInfo.event.startStr,
                end: changeInfo.event.endStr || changeInfo.event.startStr,
                allDay: changeInfo.event.allDay
              }
            : event
        )
      );
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Failed to update event. Please try again.");
      changeInfo.revert();
    }
  };

  return (
    <Box m="20px">
      <Header title="Calendar" subtitle="Full Calendar Interactive Page" />

      <Box display="flex" justifyContent="space-between">
        {/* CALENDAR SIDEBAR */}
        <Box
          flex="1 1 20%"
          backgroundColor={colors.primary[400]}
          p="15px"
          borderRadius="4px"
        >
          <Typography variant="h5">Events</Typography>
          <List>
            {currentEvents.map((event) => (
              <ListItem
                key={event.id}
                sx={{
                  backgroundColor: colors.greenAccent[500],
                  margin: "10px 0",
                  borderRadius: "2px",
                }}
              >
                <ListItemText
                  primary={event.title}
                  secondary={
                    <Typography>
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
          </List>
        </Box>

        {/* CALENDAR */}
        <Box flex="1 1 100%" ml="15px">
          <FullCalendar
            ref={calendarRef}
            height="75vh"
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
          />
        </Box>
      </Box>

      {/* Edit Event Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Edit Event</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Event Title"
            type="text"
            fullWidth
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Start Date"
            type="datetime-local"
            fullWidth
            value={editStart}
            onChange={(e) => setEditStart(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="End Date"
            type="datetime-local"
            fullWidth
            value={editEnd}
            onChange={(e) => setEditEnd(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={editAllDay}
                onChange={(e) => setEditAllDay(e.target.checked)}
              />
            }
            label="All Day Event"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteEvent} color="error">
            Delete
          </Button>
          <Button onClick={handleCloseEditDialog}>
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Calendar;