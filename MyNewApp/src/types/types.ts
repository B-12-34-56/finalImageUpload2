export interface UploadResponse {
    success: boolean;
    message: string;
    filePath?: string;
    tag?: string;  // <-- new field for the tag
  }