import React from "react";
import { Box, Typography, LinearProgress } from "@mui/material";
import { styled } from "@mui/material/styles";

const StepIndicator = styled(Box)(({ theme, active, completed }) => ({
  width: 40,
  height: 40,
  borderRadius: "50%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: completed ? "#1e3a8a" : active ? "#060829" : "#e0e0e0", // Blue for completed, Dark blue for active, Gray for default
  color: completed || active ? "#fff" : "#666",
  fontWeight: "bold",
  fontSize: "1rem",
  position: "relative",
  zIndex: 2,
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: "#e0e0e0",
  "& .MuiLinearProgress-bar": {
    backgroundColor: "#1e3a8a", // Blue for progress bar
  },
}));

const StageLoader = ({ stages, currentStage }) => {
  const progress = ((currentStage + 1) / stages.length) * 100;

  return (
    <Box sx={{ width: "100%", my: 6, px: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          position: "relative",
          mb: 4,
        }}
      >
        {stages.map((stage, index) => (
          <Box
            key={stage}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: 1,
            }}
          >
            <StepIndicator
              active={index === currentStage}
              completed={index < currentStage}
            >
              {index < currentStage ? "✓" : index + 1}
            </StepIndicator>
            <Typography
              variant="body2"
              sx={{
                mt: 2,
                textAlign: "center",
                fontWeight: index === currentStage ? "bold" : "normal",
              }}
            >
              {stage}
            </Typography>
          </Box>
        ))}
      </Box>
      <StyledLinearProgress variant="determinate" value={progress} />
    </Box>
  );
};

export default StageLoader;
