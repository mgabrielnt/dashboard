// src/scenes/team/index.jsx
import { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  useTheme, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";

// Buat instance axios dengan konfigurasi default
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*'
  },
  withCredentials: true // Setara dengan credentials: "include"
});

// Tambahkan interceptor untuk menyisipkan token di setiap request
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Tambahkan interceptor untuk handling response
api.interceptors.response.use(response => {
  return response;
}, error => {
  // Handling khusus untuk error 401 (Unauthorized)
  if (error.response && error.response.status === 401) {
    // Logika untuk redirect ke login atau refresh token
    console.error("Authentication error. Please login again.");
    // localStorage.removeItem("token");
    // window.location.href = "/login";
  }
  return Promise.reject(error);
});

const Team = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState([]);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    email: "",
    password: "",
    role: "user",
    profile_picture: "",
    phone: "",
    address: "",
    department: "",
    job_title: "",
    bio: ""
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // "add" or "edit"
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Fetch team data - Menggunakan instance api yang telah dibuat
  const fetchTeamData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/team', {
        params: {
          page: pagination.page + 1,
          limit: pagination.pageSize
        }
      });
      
      setTeamData(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }));
      
    } catch (error) {
      console.error("Error fetching team data:", error);
      showSnackbar("Failed to load team data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [pagination.page, pagination.pageSize]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle dialog open for adding new team member
  const handleAddDialogOpen = () => {
    setFormData({
      id: null,
      name: "",
      email: "",
      password: "",
      role: "user",
      profile_picture: "",
      phone: "",
      address: "",
      department: "",
      job_title: "",
      bio: ""
    });
    setDialogMode("add");
    setOpenDialog(true);
  };

  // Handle dialog open for editing team member
  const handleEditDialogOpen = (userId) => {
    const user = teamData.find(user => user.id === userId);
    if (user) {
      setFormData({
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        password: "", // Don't show password
        role: user.role || "user",
        profile_picture: user.profile_picture || "",
        phone: user.phone || "",
        address: user.address || "",
        department: user.department || "",
        job_title: user.job_title || "",
        bio: user.bio || ""
      });
      setDialogMode("edit");
      setOpenDialog(true);
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  // Show snackbar notification
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // Handle form submission dengan instance api
  const handleFormSubmit = async () => {
    try {
      if (dialogMode === "add") {
        // Create new team member
        await api.post("/api/team", formData);
        showSnackbar("Team member created successfully");
      } else {
        // Update existing team member
        await api.put(`/api/team/${formData.id}`, formData);
        showSnackbar("Team member updated successfully");
      }
      
      setOpenDialog(false);
      fetchTeamData();
    } catch (error) {
      console.error("Error saving team member:", error);
      showSnackbar(error.response?.data?.message || "Failed to save team member", "error");
    }
  };

  // Open delete confirmation dialog
  const handleDeleteConfirmOpen = (id) => {
    setSelectedUserId(id);
    setDeleteConfirmOpen(true);
  };

  // Close delete confirmation dialog
  const handleDeleteConfirmClose = () => {
    setDeleteConfirmOpen(false);
  };

  // Delete team member dengan instance api
  const handleDeleteUser = async () => {
    try {
      await api.delete(`/api/team/${selectedUserId}`);
      
      showSnackbar("Team member deleted successfully");
      fetchTeamData();
    } catch (error) {
      console.error("Error deleting team member:", error);
      showSnackbar("Failed to delete team member", "error");
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  // Data grid columns
  const columns = [
    { 
      field: "id", 
      headerName: "ID", 
      flex: 0.5 
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
    },
    {
      field: "phone",
      headerName: "Phone",
      flex: 1,
      renderCell: (params) => params.row.phone || "—",
    },
    {
      field: "department",
      headerName: "Department",
      flex: 1,
      renderCell: (params) => params.row.department || "—",
    },
    {
      field: "job_title",
      headerName: "Job Title",
      flex: 1,
      renderCell: (params) => params.row.job_title || "—",
    },
    {
      field: "role",
      headerName: "Access Level",
      flex: 1,
      renderCell: ({ row: { role } }) => {
        return (
          <Box
            width="60%"
            m="0 auto"
            p="5px"
            display="flex"
            justifyContent="center"
            backgroundColor={
              role === "admin"
                ? colors.greenAccent[600]
                : role === "manager"
                ? colors.greenAccent[700]
                : colors.greenAccent[800]
            }
            borderRadius="4px"
          >
            {role === "admin" && <AdminPanelSettingsOutlinedIcon />}
            {role === "manager" && <SecurityOutlinedIcon />}
            {role === "user" && <LockOpenOutlinedIcon />}
            <Typography color={colors.grey[100]} sx={{ ml: "5px" }}>
              {role}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: (params) => {
        return (
          <Box display="flex" justifyContent="center" gap="10px">
            <IconButton 
              onClick={() => handleEditDialogOpen(params.row.id)}
              color="secondary"
            >
              <EditIcon />
            </IconButton>
            <IconButton 
              onClick={() => handleDeleteConfirmOpen(params.row.id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="TEAM" subtitle="Managing the Team Members" />
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={handleAddDialogOpen}
        >
          Add Team Member
        </Button>
      </Box>

      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.grey[100]} !important`,
          },
        }}
      >
        <DataGrid
          rows={teamData}
          columns={columns}
          components={{ Toolbar: GridToolbar }}
          pageSize={pagination.pageSize}
          page={pagination.page}
          rowsPerPageOptions={[5, 10, 25, 50]}
          rowCount={pagination.total}
          pagination
          paginationMode="server"
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          onPageSizeChange={(pageSize) => 
            setPagination(prev => ({ ...prev, pageSize, page: 0 }))
          }
          loading={loading}
          disableSelectionOnClick
        />
      </Box>

      {/* Dialog for adding/editing team member */}
      <Dialog 
        open={openDialog} 
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "add" ? "Add New Team Member" : "Edit Team Member"}
        </DialogTitle>
        <DialogContent>
          <Box
            component="form"
            sx={{
              '& .MuiTextField-root': { m: 1 },
              display: 'flex',
              flexDirection: 'column',
            }}
            noValidate
            autoComplete="off"
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              <TextField
                required
                name="name"
                label="Name"
                value={formData.name}
                onChange={handleInputChange}
                sx={{ width: '47%' }}
              />
              <TextField
                required
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                sx={{ width: '47%' }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              <TextField
                name="password"
                label={dialogMode === "add" ? "Password" : "Password (leave blank to keep current)"}
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required={dialogMode === "add"}
                sx={{ width: '47%' }}
              />
              <TextField
                select
                name="role"
                label="Role"
                value={formData.role}
                onChange={handleInputChange}
                sx={{ width: '47%' }}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              <TextField
                name="phone"
                label="Phone"
                value={formData.phone}
                onChange={handleInputChange}
                sx={{ width: '47%' }}
              />
              <TextField
                name="job_title"
                label="Job Title"
                value={formData.job_title}
                onChange={handleInputChange}
                sx={{ width: '47%' }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              <TextField
                name="department"
                label="Department"
                value={formData.department}
                onChange={handleInputChange}
                sx={{ width: '47%' }}
              />
              <TextField
                name="profile_picture"
                label="Profile Picture URL"
                value={formData.profile_picture}
                onChange={handleInputChange}
                sx={{ width: '47%' }}
              />
            </Box>

            <TextField
              name="address"
              label="Address"
              value={formData.address}
              onChange={handleInputChange}
              fullWidth
            />

            <TextField
              name="bio"
              label="Bio"
              value={formData.bio}
              onChange={handleInputChange}
              multiline
              rows={4}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleFormSubmit} 
            variant="contained" 
            color="secondary"
          >
            {dialogMode === "add" ? "Add" : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteConfirmClose}
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this team member? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteConfirmClose}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Team;