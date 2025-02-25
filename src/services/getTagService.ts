export const getImageTag = async (filename: string): Promise<{ tag: string, filePath: String, tags: String[] } | null> => {
  const apiUrl = process.env.REACT_APP_GET_TAG_API_URL;
  // const apiKey = process.env.REACT_APP_API_KEY; // Ensure this is set in your .env file
  if (!apiUrl) {
    console.error('Get Tag API URL not set');
    return null;
  }
  
  // Remove the subfolder prefix if it exists
  // let baseFilename = filename;
  // const prefix = "image-test/";
  // if (baseFilename.startsWith(prefix)) {
  //   baseFilename = baseFilename.substring(prefix.length);
  // }
  
  const urlWithQuery = `${apiUrl}?filename=${encodeURIComponent(filename)}`;
  try {
    const response = await fetch(urlWithQuery, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // Empty body for tag retrieval
      body: '',
    });
    if (response.ok) {
      return await response.json();
    } else {
      console.error('Get Tag request not ok', response.status);
    }
  } catch (error) {
    console.error('Error fetching image tag:', error);
  }
  return null;
};
