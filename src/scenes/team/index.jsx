// src/scenes/team/index.jsx
// Enhanced with creative design elements
import { useState, useEffect } from "react";
import { 
  Box, Typography, useTheme, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton,
  Snackbar, Alert, Avatar, Chip, Tooltip, Fade, Paper, Divider,
  Card, CardContent, Badge, LinearProgress
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import {
  AdminPanelSettingsOutlined as AdminIcon,
  LockOpenOutlined as UserIcon,
  SecurityOutlined as ManagerIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as DepartmentIcon,
  CheckCircle as CheckCircleIcon
} from "@mui/icons-material";
import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*'
  },
  withCredentials: true
});

// Add interceptors for authentication
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, error => Promise.reject(error));

api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401) {
    console.error("Authentication error. Please login again.");
    // Uncomment to redirect: localStorage.removeItem("token"); window.location.href = "/login";
  }
  return Promise.reject(error);
});

// Initial form state
const initialFormState = {
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
};

const Team = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
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

  // Fetch team data
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

  // Helper functions
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDialogOpen = (mode, userId = null) => {
    if (mode === "edit" && userId) {
      const user = teamData.find(user => user.id === userId);
      if (user) {
        setFormData({
          ...initialFormState,
          ...user,
          password: "" // Don't show password
        });
      }
    } else {
      setFormData(initialFormState);
    }
    setDialogMode(mode);
    setOpenDialog(true);
  };

  // Event handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async () => {
    try {
      if (dialogMode === "add") {
        await api.post("/api/team", formData);
        showSnackbar("Team member created successfully");
      } else {
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
    { field: "id", headerName: "ID", flex: 0.5 },
    {
      field: "name",
      headerName: "Name",
      flex: 1.2,
      cellClassName: "name-column--cell",
      renderCell: (params) => {
        const initials = params.row.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase();
          
        const nameColor = `hsl(${params.row.id * 37 % 360}, 70%, 50%)`;
        
        return (
          <Box display="flex" alignItems="center">
            <Avatar
              sx={{ 
                bgcolor: nameColor,
                mr: 2,
                width: 36,
                height: 36,
                fontSize: '0.9rem'
              }}
            >
              {params.row.profile_picture ? 
                <img 
                  src={params.row.profile_picture} 
                  alt={params.row.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                /> : initials
              }
            </Avatar>
            <Typography color={colors.grey[100]} fontWeight="bold">
              {params.row.name}
            </Typography>
          </Box>
        );
      }
    },
    { 
      field: "email", 
      headerName: "Email", 
      flex: 1.2,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <EmailIcon fontSize="small" sx={{ color: colors.greenAccent[400], mr: 1 }} />
          <Typography>{params.row.email}</Typography>
        </Box>
      ) 
    },
    {
      field: "phone",
      headerName: "Phone",
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <PhoneIcon fontSize="small" sx={{ color: colors.greenAccent[400], mr: 1 }} />
          <Typography>{params.row.phone || "—"}</Typography>
        </Box>
      ),
    },
    {
      field: "department",
      headerName: "Department",
      flex: 1,
      renderCell: (params) => (
        <Chip 
          icon={<DepartmentIcon />}
          label={params.row.department || "—"}
          variant="outlined"
          size="small"
          sx={{ 
            borderColor: colors.blueAccent[400],
            color: colors.grey[100]
          }}
        />
      ),
    },
    {
      field: "job_title",
      headerName: "Job Title",
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <WorkIcon fontSize="small" sx={{ color: colors.greenAccent[400], mr: 1 }} />
          <Typography 
            variant="body2"
            sx={{ fontStyle: 'italic' }}
          >
            {params.row.job_title || "—"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "role",
      headerName: "Access Level",
      flex: 1,
      renderCell: ({ row: { role } }) => {
        // Determine role-specific styling
        const roleConfig = {
          admin: {
            icon: AdminIcon,
            color: colors.redAccent[500],
            background: colors.redAccent[800] + '33',
            label: 'Admin'
          },
          manager: {
            icon: ManagerIcon,
            color: colors.blueAccent[500],
            background: colors.blueAccent[800] + '33',
            label: 'Manager'
          },
          user: {
            icon: UserIcon,
            color: colors.greenAccent[500],
            background: colors.greenAccent[800] + '33',
            label: 'User'
          }
        };
        
        const config = roleConfig[role] || roleConfig.user;
        const RoleIcon = config.icon;
        
        return (
          <Tooltip 
            title={`${config.label} privileges`}
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 600 }}
            arrow
          >
            <Chip
              icon={<RoleIcon style={{ color: config.color }} />}
              label={config.label}
              sx={{
                bgcolor: config.background,
                color: config.color,
                borderRadius: '4px',
                '& .MuiChip-icon': {
                  mr: 0.5
                }
              }}
              size="small"
            />
          </Tooltip>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.8,
      renderCell: (params) => (
        <Box display="flex" justifyContent="center" gap="10px">
          <Tooltip title="Edit member">
            <IconButton 
              onClick={() => handleDialogOpen("edit", params.row.id)}
              color="secondary"
              size="small"
              sx={{ 
                background: colors.greenAccent[700] + '33',
                '&:hover': { background: colors.greenAccent[700] + '55' }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete member">
            <IconButton 
              onClick={() => {
                setSelectedUserId(params.row.id);
                setDeleteConfirmOpen(true);
              }}
              color="error"
              size="small"
              sx={{ 
                background: colors.redAccent[700] + '33',
                '&:hover': { background: colors.redAccent[700] + '55' }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Form field groups for the dialog
  const formFields = [
    [
      { name: "name", label: "Name", required: true, type: "text" },
      { name: "email", label: "Email", required: true, type: "email" },
    ],
    [
      { 
        name: "password", 
        label: dialogMode === "add" ? "Password" : "Password (leave blank to keep current)", 
        required: dialogMode === "add", 
        type: "password" 
      },
      { 
        name: "role", 
        label: "Role", 
        type: "select",
        options: [
          { value: "user", label: "User" },
          { value: "manager", label: "Manager" },
          { value: "admin", label: "Admin" },
        ]
      },
    ],
    [
      { name: "phone", label: "Phone", type: "text" },
      { name: "job_title", label: "Job Title", type: "text" },
    ],
    [
      { name: "department", label: "Department", type: "text" },
      { name: "profile_picture", label: "Profile Picture URL", type: "text" },
    ],
    [
      { name: "address", label: "Address", type: "text", fullWidth: true },
    ],
    [
      { name: "bio", label: "Bio", type: "textarea", rows: 4, fullWidth: true },
    ],
  ];

  // Stats calculation
  const stats = {
    total: pagination.total,
    admins: teamData.filter(user => user.role === 'admin').length,
    managers: teamData.filter(user => user.role === 'manager').length,
    users: teamData.filter(user => user.role === 'user').length
  };

  return (
    <Box m="20px">
      {/* Header with animated badge */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
        mb={2}
      >
        <Header title="TEAM" subtitle="Managing the Team Members" />
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => fetchTeamData()}
            startIcon={<RefreshIcon />}
            sx={{
              transition: 'all 0.2s',
              '&:hover': { transform: 'scale(1.05)' }
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => handleDialogOpen("add")}
            sx={{
              background: `linear-gradient(90deg, ${colors.greenAccent[500]}, ${colors.blueAccent[400]})`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s',
              '&:hover': { transform: 'scale(1.05)' }
            }}
          >
            Add Team Member
          </Button>
        </Box>
      </Box>
      
      {/* Stats cards */}
      <Box 
        display="flex" 
        gap={2} 
        mb={3}
      >
        {[
          { title: 'Total Members', value: stats.total, color: colors.grey[100], bgColor: colors.blueAccent[600] },
          { title: 'Admins', value: stats.admins, color: colors.redAccent[400], bgColor: colors.primary[400] },
          { title: 'Managers', value: stats.managers, color: colors.blueAccent[400], bgColor: colors.primary[400] },
          { title: 'Users', value: stats.users, color: colors.greenAccent[400], bgColor: colors.primary[400] }
        ].map((stat, i) => (
          <Card 
            key={i}
            sx={{ 
              flexGrow: 1,
              background: i === 0 ? stat.bgColor : `${colors.primary[400]}aa`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${stat.color}33`,
              boxShadow: `0 4px 20px ${stat.color}22`,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-5px)' }
            }}
          >
            <CardContent>
              <Typography variant="h5" fontWeight="bold" mb={1}>
                {stat.title}
              </Typography>
              <Typography 
                variant="h3" 
                fontWeight="bold"
                sx={{ color: stat.color }}
              >
                {stat.value}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats.total ? (stat.value / stats.total) * 100 : 0}
                sx={{ 
                  mt: 1, 
                  height: 4,
                  borderRadius: 2,
                  bgcolor: `${stat.color}22`,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: stat.color
                  }
                }} 
              />
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Data Grid */}
      <Paper
        elevation={3}
        sx={{
          height: "68vh",
          background: `${colors.primary[400]}aa`,
          backdropFilter: 'blur(10px)',
          borderRadius: '10px',
          overflow: 'hidden',
          border: `1px solid ${colors.grey[700]}`,
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
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': { 
              borderBottom: `1px solid ${colors.grey[800]}`,
              padding: '16px',
            },
            '& .name-column--cell': { color: colors.greenAccent[300] },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: colors.blueAccent[800],
              borderBottom: 'none',
              paddingTop: '8px',
              paddingBottom: '8px',
            },
            '& .MuiDataGrid-virtualScroller': {
              backgroundColor: 'transparent',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: 'none',
              backgroundColor: colors.blueAccent[800],
            },
            '& .MuiCheckbox-root': {
              color: `${colors.greenAccent[200]} !important`,
            },
            '& .MuiDataGrid-toolbarContainer .MuiButton-text': {
              color: `${colors.grey[100]} !important`,
            },
            '& .MuiDataGrid-row': {
              transition: 'background-color 0.2s',
              '&:hover': {
                backgroundColor: `${colors.primary[500]}80 !important`,
              },
            },
            '& .MuiDataGrid-columnSeparator': {
              display: 'none',
            },
          }}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '10px',
            background: colors.primary[400],
            backgroundImage: `linear-gradient(135deg, ${colors.primary[600]}80 25%, transparent 25%, transparent 50%, ${colors.primary[600]}80 50%, ${colors.primary[600]}80 75%, transparent 75%, transparent)`,
            backgroundSize: '20px 20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '5px',
          background: `linear-gradient(90deg, ${colors.greenAccent[500]}, ${colors.blueAccent[400]})`,
        }} />
        
        <DialogTitle sx={{ 
          pb: 1, 
          display: 'flex', 
          alignItems: 'center',
          gap: 1
        }}>
          {dialogMode === "add" ? (
            <AddIcon fontSize="large" sx={{ color: colors.greenAccent[400] }} />
          ) : (
            <EditIcon fontSize="large" sx={{ color: colors.blueAccent[400] }} />
          )}
          <Typography variant="h4" fontWeight="bold">
            {dialogMode === "add" ? "Add New Team Member" : "Edit Team Member"}
          </Typography>
        </DialogTitle>
        
        <Divider sx={{ mb: 2 }} />
        
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
            {formFields.map((row, rowIndex) => (
              <Box key={rowIndex} sx={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                mb: rowIndex < formFields.length - 1 ? 1 : 0 
              }}>
                {row.map((field) => (
                  <TextField
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    type={field.type}
                    value={formData[field.name]}
                    onChange={handleInputChange}
                    required={field.required}
                    sx={{ 
                      width: field.fullWidth ? '98%' : '47%',
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: colors.greenAccent[400],
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.greenAccent[400],
                        },
                      },
                    }}
                    InputProps={{
                      sx: { borderRadius: '8px' },
                      startAdornment: field.name === 'name' ? <PersonIcon sx={{ color: colors.greenAccent[400], mr: 1 }} /> : 
                                    field.name === 'email' ? <EmailIcon sx={{ color: colors.greenAccent[400], mr: 1 }} /> :
                                    field.name === 'phone' ? <PhoneIcon sx={{ color: colors.greenAccent[400], mr: 1 }} /> :
                                    field.name === 'address' ? <LocationIcon sx={{ color: colors.greenAccent[400], mr: 1 }} /> :
                                    field.name === 'department' ? <DepartmentIcon sx={{ color: colors.greenAccent[400], mr: 1 }} /> :
                                    field.name === 'job_title' ? <WorkIcon sx={{ color: colors.greenAccent[400], mr: 1 }} /> :
                                    null
                    }}
                    multiline={field.type === "textarea"}
                    rows={field.rows}
                    select={field.type === "select"}
                  >
                    {field.options?.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                ))}
              </Box>
            ))}
          </Box>
        </DialogContent>
        
        <Divider sx={{ mt: 2 }} />
        
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            variant="outlined"
            sx={{
              borderColor: colors.grey[500],
              color: colors.grey[300],
              '&:hover': {
                borderColor: colors.grey[300],
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleFormSubmit} 
            variant="contained" 
            sx={{
              background: `linear-gradient(90deg, ${colors.greenAccent[500]}, ${colors.blueAccent[400]})`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              px: 3,
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
              }
            }}
          >
            {dialogMode === "add" ? "Add Member" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '10px',
            background: colors.primary[400],
            backgroundImage: `radial-gradient(${colors.redAccent[700]}20 2px, transparent 2px)`,
            backgroundSize: '15px 15px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '5px',
          background: colors.redAccent[500],
        }} />
        
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: colors.redAccent[400]
        }}>
          <DeleteIcon color="error" />
          <Typography variant="h5" fontWeight="bold">
            Confirm Delete
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 1 }}>
          <Box display="flex" flexDirection="column" alignItems="center" pt={2} pb={1}>
            <Avatar
              sx={{
                bgcolor: colors.redAccent[500] + '33',
                width: 60,
                height: 60,
                mb: 2
              }}
            >
              <DeleteIcon fontSize="large" sx={{ color: colors.redAccent[500] }} />
            </Avatar>
            
            <Typography align="center" sx={{ maxWidth: '90%' }}>
              Are you sure you want to delete this team member? 
              <br />
              <Typography component="span" color="error" fontWeight="bold">
                This action cannot be undone.
              </Typography>
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)}
            variant="outlined"
            sx={{
              borderColor: colors.grey[500],
              color: colors.grey[300],
              '&:hover': {
                borderColor: colors.grey[300],
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteUser} 
            color="error" 
            variant="contained"
            sx={{
              backgroundColor: colors.redAccent[500],
              '&:hover': {
                backgroundColor: colors.redAccent[400],
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Fade}
        sx={{ mb: 4 }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          variant="filled"
          icon={snackbar.severity === 'success' ? <CheckCircleIcon /> : undefined}
          sx={{ 
            width: '100%',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem',
              mr: 1
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Team;