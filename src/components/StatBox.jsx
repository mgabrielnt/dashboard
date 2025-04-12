import { Box, Typography, useTheme } from "@mui/material";
import ProgressCircle from "./ProgressCircle";
import { tokens } from "../theme";
import React from "react";

// Enhanced StatBox component with better visual presentation
const StatBox = ({ title, subtitle, icon, progress, increase }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box width="100%" p="15px 20px">
      <Box display="flex" justifyContent="space-between">
        {/* ICON */}
        <Box>
          {icon}
        </Box>
        
        {/* PROGRESS CIRCLE */}
        <Box>
          <ProgressCircle progress={progress} size="40" />
        </Box>
      </Box>
      
      {/* ENTITY VALUE */}
      <Box mt="10px">
        <Typography variant="h4" fontWeight="bold" sx={{ color: colors.greenAccent[500] }}>
          {title}
        </Typography>
        <Typography variant="h5" sx={{ color: colors.grey[100] }}>
          {subtitle}
        </Typography>
      </Box>
      
      {/* PERCENTAGE INCREASE */}
      <Box display="flex" justifyContent="space-between" mt="2px">
        <Typography variant="h5" sx={{ color: colors.greenAccent[500], fontStyle: "italic" }}>
          {increase}
        </Typography>
      </Box>
    </Box>
  );
};

export default React.memo(StatBox);