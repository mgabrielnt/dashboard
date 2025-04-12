import React, { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Breadcrumbs, Link as MuiLink, Typography, Box, useTheme } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { tokens } from '../theme';

const Breadcrumb = () => {
  const location = useLocation();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  // Define route mappings for display names
  const routeMap = {
    '': 'Home',
    'team': 'Team Management',
    'contacts': 'Scientific Instrumentations',
    'contacts1': 'PT BKI Certification',
    'contacts2': 'System Integration',
    'invoices': 'Invoices',
    'form': 'Form',
    'chatbot': 'ChatBot',
    'bar': 'Bar Chart',
    'pie': 'Pie Chart',
    'line': 'Line Chart',
    'faq': 'FAQ',
    'calendar': 'Calendar',
    'geography': 'Geography',
    'profile': 'User Profile'
  };

  // Generate breadcrumb paths based on current location
  const pathnames = useMemo(() => {
    return location.pathname.split('/').filter(x => x);
  }, [location]);
  
  // If we're on the dashboard (root path), don't show breadcrumbs
  if (location.pathname === '/') {
    return null;
  }

  return (
    <Box
      sx={{
        backgroundColor: colors.primary[400],
        borderRadius: '4px',
        padding: '8px 16px',
        marginBottom: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        <MuiLink
          component={Link}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: colors.greenAccent[400],
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
              color: colors.greenAccent[300]
            }
          }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </MuiLink>
        
        {pathnames.map((path, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayName = routeMap[path] || path.charAt(0).toUpperCase() + path.slice(1);

          return isLast ? (
            <Typography 
              key={path}
              color={colors.grey[100]}
              fontWeight="bold"
            >
              {displayName}
            </Typography>
          ) : (
            <MuiLink
              component={Link}
              key={path}
              to={routeTo}
              sx={{
                color: colors.blueAccent[300],
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                  color: colors.blueAccent[200]
                }
              }}
            >
              {displayName}
            </MuiLink>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default Breadcrumb;