import { Platform } from 'react-native';

export interface TagResponse {
  tag?: string;
  filePath?: string;
  tags?: { Key: string; Value: string }[]; // Object array for tags
  duplicate?: boolean;
  hasTags?: boolean;
  originalKey?: string;
}

/**
 * Gets image tags from the API
 * @param {string} filename - The filename to check for tags
 * @returns {Promise<TagResponse | null>} The tag response object or null if error
 */
export const getImageTag = async (filename: string): Promise<TagResponse | null> => {
  // In Expo, environment variables should be prefixed with EXPO_PUBLIC_
  const apiUrl = process.env.EXPO_PUBLIC_GET_TAG_API_URL;
  
  if (!apiUrl) {
    console.error('Get Tag API URL not set');
    return null;
  }
  
  const urlWithQuery = `${apiUrl}?filename=${encodeURIComponent(filename)}`;
  
  try {
    console.log(`Making POST request to: ${urlWithQuery}`);
    
    const response = await fetch(urlWithQuery, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // Empty body for tag retrieval
      body: '',
      // Add mode to help with CORS - Note: This is only relevant on web
      ...(Platform.OS === 'web' ? { mode: 'cors' } : {})
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Got response:', data);
      return data;
    } else {
      console.error('Get Tag request failed', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error fetching image tag:', error);
  }
  
  return null;
};