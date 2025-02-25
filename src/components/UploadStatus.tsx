import React from 'react';
import { Alert, Snackbar } from '@mui/material';

interface UploadStatusProps {
  message: string;
  type: 'success' | 'error';
  open: boolean;
  onClose: () => void;
}

export const UploadStatus: React.FC<UploadStatusProps> = ({
  message,
  type,
  open,
  onClose,
}) => {
  return (
    <Snackbar open={open} autoHideDuration={60000} onClose={onClose}>
      <Alert onClose={onClose} severity={type} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};