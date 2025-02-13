// src/services/getTagService.ts

export const getImageTag = async (filename: string): Promise<{ tag: string } | null> => {
    // Use an environment variable to get the endpoint.
    const apiUrl = process.env.REACT_APP_GET_TAG_API_URL;
    if (!apiUrl) {
      console.error('Get Tag API URL not set');
      return null;
    }
    try {
      const response = await fetch(`${apiUrl}?filename=${encodeURIComponent(filename)}`);
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