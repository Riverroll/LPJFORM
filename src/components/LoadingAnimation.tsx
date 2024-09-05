import React from 'react';
import { CircularProgress, Typography, Box } from '@mui/material';

interface LoadingAnimationProps {
  message: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ message }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bgcolor="rgba(255, 255, 255, 0.7)"
      zIndex={9999}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" style={{ marginTop: '20px' }}>
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingAnimation;