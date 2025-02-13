import React from 'react';
import { Card, CardMedia, IconButton, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface ImagePreviewProps {
  imageUrl: string;
  onDelete: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl, onDelete }) => {
  return (
    <Card sx={{ position: 'relative', maxWidth: 345, margin: '16px 0' }}>
      <CardMedia
        component="img"
        height="200"
        image={imageUrl}
        alt="Uploaded preview"
      />
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '50%',
        }}
      >
        <IconButton onClick={onDelete} size="small">
          <DeleteIcon />
        </IconButton>
      </Box>
    </Card>
  );
};
