import React, { useState } from "react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_BUCKET = "filter-slide";
const REGION = "us-east-1";
const SUBFOLDER = "image-test/";

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: "AKIAU6GD3P3JDEGAPNG5",  // Store securely (Use ENV variables in production)
    secretAccessKey: "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",
  },
});

const UploadToS3 = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const uploadFile = async () => {
    if (!file) return alert("Please select a file first!");
  
    
    setUploading(true);
    const fileKey = `${SUBFOLDER}${file.name}`;

    try{
      const params = {
        Bucket: S3_BUCKET,
        Key: fileKey,
        ContentType: file.type,
     };
  
      // Generate signed URL
      const command = new PutObjectCommand(params);
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      // Upload to S3
      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (response.ok) {
        alert("File uploaded successfully!");
      } else {
        alert("Upload failed.");
      }
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Upload error!");
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
      {progress > 0 && <p>Progress: {progress}%</p>}
    </div>
  );
};

export default UploadToS3;
