import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
const EXPO_PUBLIC_UPLOAD_API_URL = process.env.EXPO_PUBLIC_UPLOAD_API_URL;

export interface UploadResponse {
  success: boolean;
  message: string;
  filePath?: string;
  tag?: string; // If your Lambda returns a tag
}

export interface ImageInfo {
  uri: string;
  name: string;
  type: string;
}

/**
 * Uploads an image to the server
 * @param {ImageInfo} imageInfo - The image information including URI, name and type
 * @returns {Promise<UploadResponse>} The upload response
 */
export const uploadImage = async (imageInfo: ImageInfo): Promise<UploadResponse> => {
  // Use imported environment variable instead of process.env
  const apiUrl = EXPO_PUBLIC_UPLOAD_API_URL;
  
  if (!apiUrl) {
    return {
      success: false,
      message: 'Upload API URL not set',
    };
  }
  
  // Append the filename as a query param if needed by your Lambda
  const url = `${apiUrl}?filename=${encodeURIComponent(imageInfo.name)}`;
  
  try {
    // For React Native, we need to handle the file upload differently
    if (Platform.OS === 'web') {
      // If running on web, we can use fetch with blob
      const response = await fetch(imageInfo.uri);
      const blob = await response.blob();
      const uploadResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': imageInfo.type || 'application/octet-stream',
        },
        body: blob,
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }
      
      return await uploadResponse.json();
    } else {
      // For native platforms, we use FileSystem.uploadAsync
      const contentType = imageInfo.type || 'application/octet-stream';
      
      // FileSystem.uploadAsync is the Expo equivalent for file uploads
      const uploadResult = await FileSystem.uploadAsync(url, imageInfo.uri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          'Content-Type': contentType,
        },
      });
      
      if (uploadResult.status >= 200 && uploadResult.status < 300) {
        // Parse the response body if it's JSON
        try {
          return JSON.parse(uploadResult.body);
        } catch (parseError) {
          // If response is not JSON, create a simple success object
          return {
            success: true,
            message: 'Upload successful',
          };
        }
      } else {
        throw new Error(`Upload failed with status ${uploadResult.status}: ${uploadResult.body}`);
      }
    }
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

/**
 * Alternative implementation using multipart/form-data
 * Some APIs might require this format instead of raw binary
 */
export const uploadImageMultipart = async (imageInfo: ImageInfo): Promise<UploadResponse> => {
  // Use imported environment variable
  const apiUrl = EXPO_PUBLIC_UPLOAD_API_URL;
  
  if (!apiUrl) {
    return {
      success: false,
      message: 'Upload API URL not set',
    };
  }
  
  try {
    // Create form data object
    const formData = new FormData();
    
    // Append the file to form data with the correct structure for React Native
    if (Platform.OS === 'web') {
      // For web, get the blob first
      const response = await fetch(imageInfo.uri);
      const blob = await response.blob();
      formData.append('file', blob, imageInfo.name);
    } else {
      // For React Native, we need to use this specific format
      formData.append('file', {
        uri: imageInfo.uri,
        name: imageInfo.name,
        type: imageInfo.type || 'application/octet-stream',
      } as any);
    }
    
    // Send the request with form data
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};