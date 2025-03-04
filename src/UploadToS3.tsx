import React, { useState, ChangeEvent } from "react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getImageTag } from "./services/getTagService.ts";
import { UploadStatus } from "./components/UploadStatus.tsx";
import { Box, Button, Typography, Paper, Chip, Card, CardContent, Divider } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";

const S3_BUCKET = "filter-slide";
const REGION = "us-east-1";
const SUBFOLDER = "image-test/";

// Use environment variables or secure storage for credentials in production
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY || "AKIAU6GD3P3JDEGAPNG5",
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_KEY || "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",
  },
});

const UploadToS3: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
    show: boolean;
  }>({ message: "", type: "success", show: false });
  
  // State for duplicate detection
  const [duplicateInfo, setDuplicateInfo] = useState<{
    isDuplicate: boolean;
    hasTags: boolean;
    tags: { Key: string; Value: string }[];
    originalKey: string;
  } | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      // Reset duplicate info when a new file is selected
      setDuplicateInfo(null);
    }
  };

  // Poll for the image tag
  const pollForTag = async (filename: string) => {
    const maxAttempts = 3;
    let attempts = 0;
    console.log("Starting pollForTag with filename:", filename);
    
    const interval = setInterval(async () => {
      attempts++;
      console.log(`Polling attempt ${attempts} for filename: ${filename}`);
      const tagResult = await getImageTag(filename);
      console.log("Tag result:", tagResult);
      
      // Check if the response contains a non-empty "tags" array
      if (tagResult && tagResult.tags && tagResult.tags.length > 0) {
        clearInterval(interval);
        setStatus({
          message: `Image uploaded successfully with tags: ${JSON.stringify(
            tagResult.tags
          )}`,
          type: "success",
          show: true,
        });
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        setStatus({
          message: "Image uploaded successfully but tags were not found",
          type: "info",
          show: true,
        });
      } else {
        setStatus({
          message: `Checking for tags... (Attempt ${attempts}/${maxAttempts})`,
          type: "info",
          show: true,
        });
      }
    }, 3000); // Poll every 3 seconds
  };

  // Unified upload function that handles both deduplication and direct upload
  const uploadFile = async () => {
    if (!file) {
      setStatus({
        message: "Please select a file first!",
        type: "error",
        show: true,
      });
      return;
    }

    setUploading(true);
    setStatus({
      message: "Processing your image...",
      type: "info",
      show: true,
    });

    // First, try uploading to S3 with presigned URL (more reliable method)
    const fileKey = `${SUBFOLDER}${file.name}`;

    try {
      // Set up the S3 upload params
      const params = {
        Bucket: S3_BUCKET,
        Key: fileKey,
        ContentType: file.type,
      };

      // Generate presigned URL
      const command = new PutObjectCommand(params);
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      console.log("Generated upload URL:", uploadUrl);

      // Upload the file to S3
      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!response.ok) {
        throw new Error(`S3 upload failed with status: ${response.status}`);
      }

      console.log("S3 upload successful, now checking for duplicates...");
      
      // Now check if the image is a duplicate using the Lambda function
      // We're using getImageTag here with a POST request, which will trigger
      // the deduplication check in your Lambda function
      const tagResult = await getImageTag(file.name);
      console.log("Tag result after upload:", tagResult);
      
      if (tagResult && tagResult.duplicate) {
        // It's a duplicate
        setDuplicateInfo({
          isDuplicate: true,
          hasTags: tagResult.hasTags || false,
          tags: tagResult.tags || [],
          originalKey: tagResult.originalKey || "",
        });
        
        // Set status based on tag status
        if (tagResult.hasTags) {
          setStatus({
            message: "Duplicate found with tag",
            type: "warning",
            show: true,
          });
        } else {
          setStatus({
            message: "Duplicate found with no tag",
            type: "warning",
            show: true,
          });
        }
      } else {
        // Not a duplicate, poll for tags
        setStatus({
          message: "Image uploaded successfully. Checking for tags...",
          type: "success",
          show: true,
        });
        pollForTag(file.name);
      }
    } catch (error) {
      console.error("Upload Error:", error);
      setStatus({ 
        message: error instanceof Error ? error.message : "Upload error!", 
        type: "error", 
        show: true 
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom fontWeight="medium">
        Upload Image
      </Typography>
      
      <Box sx={{ my: 2 }}>
        <input
          accept="image/*"
          style={{ display: 'none' }}
          id="file-upload"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="file-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUploadIcon />}
            sx={{ mr: 2 }}
          >
            Select Image
          </Button>
        </label>
        
        {file && (
          <Typography variant="body2" component="span" sx={{ ml: 2 }}>
            {file.name} ({Math.round(file.size / 1024)} KB)
          </Typography>
        )}
      </Box>
      
      <Box sx={{ my: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={uploadFile}
          disabled={uploading || !file}
        >
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </Box>
      
      {/* Duplicate Information Display */}
      {duplicateInfo && (
        <Card sx={{ mt: 3, bgcolor: '#FFF9C4', borderLeft: '4px solid #FBC02D' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <WarningIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Duplicate Image Detected
              </Typography>
            </Box>
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              This image has already been uploaded before.
            </Typography>
            
            <Divider sx={{ my: 1 }} />
            
            {duplicateInfo.hasTags ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags from original image:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {duplicateInfo.tags.map((tag, index) => (
                    <Chip 
                      key={index} 
                      label={`${tag.Key}: ${tag.Value}`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <InfoIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  The original image has no tags.
                </Typography>
              </Box>
            )}
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Original file: {duplicateInfo.originalKey}
            </Typography>
          </CardContent>
        </Card>
      )}
      
      <UploadStatus
        message={status.message}
        type={status.type}
        open={status.show}
        onClose={() => setStatus({ ...status, show: false })}
      />
    </Paper>
  );
};

export default UploadToS3;
