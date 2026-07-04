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
  
  const routeMap = {
    '': 'Home',
    'team': 'Team Management',
    'contacts': 'PT Superintending Company of Indonesia (SUCOFINDO)',
    'contacts1': 'PT Biro Klasifikasi Indonesia (Persero)',
    'contacts2': 'PT Surveyor Indonesia (Persero)',
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

  const pathnames = useMemo(() => {
    return location.pathname.split('/').filter(x => x);
  }, [location]);
  
  if (location.pathname === '/') {
    return null;
  }

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, rgba(244,196,48,0.10), rgba(103,232,249,0.06))',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '16px',
        padding: '10px 16px',
        marginBottom: '16px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.20)',
        backdropFilter: 'blur(18px)'
      }}
    >
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
        <MuiLink
          component={Link}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: colors.blueAccent[300],
            textDecoration: 'none',
            fontWeight: 800,
            '&:hover': {
              textDecoration: 'none',
              color: colors.blueAccent[200]
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
            <Typography key={path} color={colors.grey[100]} fontWeight="900">
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
                fontWeight: 800,
                '&:hover': {
                  textDecoration: 'none',
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
