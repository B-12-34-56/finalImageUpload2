// src/services/presignService.ts
export const getPresignedUrl = async (filename: string): Promise<string> => {
    // Ensure you have an environment variable for the presign endpoint.
    // For example, in your .env file:
    // REACT_APP_PRESIGN_API_URL=https://your-api-endpoint.amazonaws.com/prod/getPresignedUrl
    const apiUrl = process.env.REACT_APP_PRESIGN_API_URL;
    if (!apiUrl) {
      throw new Error("Presign API URL not set in environment variables.");
    }
    const urlWithQuery = `${apiUrl}?filename=${encodeURIComponent(filename)}`;
    const response = await fetch(urlWithQuery, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (data && data.presignedUrl) {
      return data.presignedUrl;
    }
    throw new Error("Failed to get presigned URL");
  };
  