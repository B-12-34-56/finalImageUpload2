import React from 'react';
import { Alert, Snackbar } from '@mui/material';

interface UploadStatusProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  open: boolean;
  onClose: () => void;
  autoHideDuration?: number;
}

export const UploadStatus: React.FC<UploadStatusProps> = ({
  message,
  type,
  open,
  onClose,
  autoHideDuration = 60000, // Default to 6 seconds for auto-hide
}) => {
  // Only auto-hide success and info messages
  const actualDuration = type === 'success' || type === 'info' 
    ? autoHideDuration 
    : null; // null means don't auto-hide
  
  return (
    <Snackbar 
      open={open} 
      autoHideDuration={actualDuration} 
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert 
        onClose={onClose} 
        severity={type} 
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};
