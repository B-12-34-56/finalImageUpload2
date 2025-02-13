// src/services/uploadService.ts

export interface UploadResponse {
  success: boolean;
  message: string;
  filePath?: string;
  tag?: string; // If your Lambda returns a tag
}

export const uploadImage = async (file: File): Promise<UploadResponse> => {
  // Read the API endpoint from your .env
  const apiUrl = process.env.REACT_APP_UPLOAD_API_URL;
  if (!apiUrl) {
    return {
      success: false,
      message: 'Upload API URL not set',
    };
  }

  // Append the filename as a query param if needed by your Lambda
  const url = `${apiUrl}?filename=${encodeURIComponent(file.name)}`;

  try {
    // Use the file’s type (e.g., "image/jpeg") as the Content-Type
    // If file.type is empty, fall back to application/octet-stream
    const contentType = file.type || 'application/octet-stream';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
      },
      // Pass the file as raw binary so that API Gateway can handle it properly
      body: file,
    });

    // Expect a JSON response from your Lambda
    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      message: 'Upload failed',
    };
  }
};
