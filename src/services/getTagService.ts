interface TagResponse {
  tag?: string;
  filePath?: string;
  tags?: { Key: string; Value: string }[];  // Changed from String[] to object array
  duplicate?: boolean;
  hasTags?: boolean;
  originalKey?: string;
}

export const getImageTag = async (filename: string): Promise<TagResponse | null> => {
  const apiUrl = process.env.REACT_APP_GET_TAG_API_URL;
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
      // Add mode to help with CORS
      mode: 'cors'
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
