import React, { useCallback, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { uploadImage } from '../services/uploadService';
import { ImagePreview } from './ImagePreview';
import { UploadStatus } from './UploadStatus';
import { getImageTag } from '../services/getTagService';

export const ImageUploader: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  }>({
    message: '',
    type: 'success',
    show: false,
  });

  // Poll for the image tag by querying the API endpoint
  const pollForTag = async (filename: string) => {
    const maxAttempts = 10;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const tagResult = await getImageTag(filename);
      if (tagResult && tagResult.tag) {
        clearInterval(interval);
        setStatus({
          message: `Image uploaded successfully with tag "${tagResult.tag}"!`,
          type: 'success',
          show: true,
        });
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        setStatus({
          message: 'Image uploaded successfully but tag was not found.',
          type: 'success',
          show: true,
        });
      }
    }, 3000); // poll every 3 seconds
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadImage(file);
      console.log('Upload result:', result);

      if (result.success) {
        // Set a local preview of the file
        setUploadedImage(URL.createObjectURL(file));

        // If we got a file path, extract the filename and poll for tag
        if (result.filePath) {
          const parts = result.filePath.split('/');
          const filename = parts[parts.length - 1];

          setStatus({
            message: 'Image uploaded successfully! Waiting for tag...',
            type: 'success',
            show: true,
          });

          pollForTag(filename);
        } else {
          // If success is true but no filePath is provided, just show success
          setStatus({
            message: 'Image uploaded successfully!',
            type: 'success',
            show: true,
          });
        }
      } else {
        // We received a success=false or a mismatch in expected fields
        console.error('Upload error: ', result.message);
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error in onDrop:', error);
      setStatus({
        message: 'Failed to upload image',
        type: 'error',
        show: true,
      });
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    },
    multiple: false,
  });

  const handleDelete = () => {
    setUploadedImage(null);
  };

  return (
    <Box sx={{ maxWidth: 600, margin: '0 auto', padding: 3 }}>
      {!uploadedImage && (
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed #ccc',
            borderRadius: 2,
            padding: 3,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          }}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <CircularProgress />
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                {isDragActive
                  ? 'Drop the image here'
                  : 'Drag and drop an image, or click to select'}
              </Typography>
            </>
          )}
        </Box>
      )}

      {uploadedImage && (
        <ImagePreview imageUrl={uploadedImage} onDelete={handleDelete} />
      )}

      <UploadStatus
        message={status.message}
        type={status.type}
        open={status.show}
        onClose={() => setStatus((prev) => ({ ...prev, show: false }))}
      />
    </Box>
  );
};
