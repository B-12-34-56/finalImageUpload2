import React, { useState, ChangeEvent } from "react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getImageTag } from "./services/getTagService.ts";
import { UploadStatus } from "./components/UploadStatus.tsx";

const S3_BUCKET = "filter-slide";
const REGION = "us-east-1";
const SUBFOLDER = "image-test/";

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: "AKIAU6GD3P3JDEGAPNG5", // Store securely (use environment variables in production)
    secretAccessKey: "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",
  },
});

const UploadToS3: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{
    message: string;
    type: "success" | "error";
    show: boolean;
  }>({ message: "", type: "success", show: false });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  // Poll for the image tag.
  // We cast the response as any to access the message property if it exists.
  const pollForTag = async (filename: string) => {
    const maxAttempts = 3;
    let attempts = 0;
    console.log("Starting pollForTag with filename:", filename);
    const interval = setInterval(async () => {
      attempts++;
      console.log(`Polling attempt ${attempts} for filename: ${filename}`);
      const tagResult = await getImageTag(filename);
      console.log("Tag result:", tagResult);
      // Cast tagResult as any so we can access the "message" property.
      const responseMessage = (tagResult as any).message || "";
      console.log("responseMessage", responseMessage);
      if (responseMessage.includes("Duplicate image detected")) {
        clearInterval(interval);
        if (tagResult && tagResult.tags && tagResult.tags.length > 0) {
          setStatus({
            message: `Image already exists: tags found: ${JSON.stringify(tagResult.tags)} BLOCKED IMAGE`,
            type: "error",
            show: true,
          });
        } else {
          setStatus({
            message: "Image already exists, no tags found.",
            type: "success",
            show: true,
          });
        }
      } else if (tagResult && tagResult.tags && tagResult.tags.length > 0) {
        clearInterval(interval);
        setStatus({
          message: `Image uploaded successfully with tags: ${JSON.stringify(tagResult.tags)}`,
          type: "success",
          show: true,
        });
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        setStatus({
          message: "Image uploaded successfully but tags were not found: " + filename,
          type: "success",
          show: true,
        });
      } else {
        setStatus({
          message: "Retry in progress " + attempts + " " + filename,
          type: "error",
          show: true,
        });
      }
    }, 3000); // Poll every 3 seconds
  };

  const uploadFile = async () => {
    if (!file) {
      setStatus({ message: "Please select a file first!", type: "error", show: true });
      return;
    }
  
    setUploading(true);
    const fileKey = `${SUBFOLDER}${file.name}`;
  
    try {
      const params = {
        Bucket: S3_BUCKET,
        Key: fileKey,
        ContentType: file.type,
      };
  
      const command = new PutObjectCommand(params);
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      console.log("Generated upload URL:", uploadUrl);
  
      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
  
      if (response.ok) {
        setStatus({
          message: "File uploaded successfully. Checking system for malware...",
          type: "success",
          show: true,
        });
        // Pass just the base filename so the backend constructs the correct S3 key.
        pollForTag(file.name);
      } else {
        setStatus({ message: "Upload failed.", type: "error", show: true });
      }
    } catch (error) {
      console.error("Upload Error:", error);
      setStatus({ message: "Upload error!", type: "error", show: true });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold">Upload Image here</h2>
      <input type="file" onChange={handleFileChange} className="my-2" />
      <button
        onClick={uploadFile}
        disabled={uploading}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      <UploadStatus
        message={status.message}
        type={status.type}
        open={status.show}
        onClose={() => setStatus({ ...status, show: false })}
      />
    </div>
  );
};

export default UploadToS3;
