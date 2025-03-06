import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView,
  Platform
} from "react-native";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { MaterialIcons } from "@expo/vector-icons";
import { getImageTag } from "./services/getTagService";
import { UploadStatus } from "./components/UploadStatus";

const S3_BUCKET = "filter-slide";
const REGION = "us-east-1";
const SUBFOLDER = "image-test/";

// Use environment variables or secure storage for credentials in production
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.EXPO_PUBLIC_AWS_ACCESS_KEY || "AKIAU6GD3P3JDEGAPNG5",
    secretAccessKey: process.env.EXPO_PUBLIC_AWS_SECRET_KEY || "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",
  },
});

interface TagType {
  Key: string;
  Value: string;
}

interface DuplicateInfo {
  isDuplicate: boolean;
  hasTags: boolean;
  tags: TagType[];
  originalKey: string;
}

interface StatusType {
  message: string;
  type: "success" | "error" | "warning" | "info";
  show: boolean;
}

interface ImageAsset {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileSize?: number;
}

const UploadToS3: React.FC = () => {
  const [image, setImage] = useState<ImageAsset | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [status, setStatus] = useState<StatusType>({
    message: "",
    type: "success",
    show: false,
  });
  
  // State for duplicate detection
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

  const pickImage = async (): Promise<void> => {
    // Reset duplicate info when a new image is selected
    setDuplicateInfo(null);
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  // Poll for the image tag
  const pollForTag = async (filename: string): Promise<void> => {
    const maxAttempts = 3;
    let attempts = 0;
    console.log("Starting pollForTag with filename:", filename);
    
    const interval = setInterval(async () => {
      attempts++;
      console.log(`Polling attempt ${attempts} for filename: ${filename}`);
      
      const tagResult = await getImageTag(filename);
      console.log("Tag result:", tagResult);
      
      // Check if the response contains a non-empty "tags" array
      if (tagResult && tagResult.tags && tagResult.tags.length > 0) {
        clearInterval(interval);
        setStatus({
          message: `Image uploaded successfully with tags: ${JSON.stringify(tagResult.tags)}`,
          type: "success",
          show: true,
        });
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        setStatus({
          message: "Image uploaded successfully but tags were not found",
          type: "info",
          show: true,
        });
      } else {
        setStatus({
          message: `Checking for tags... (Attempt ${attempts}/${maxAttempts})`,
          type: "info",
          show: true,
        });
      }
    }, 3000); // Poll every 3 seconds
  };

  // Function to get filename from URI
  const getFilenameFromUri = (uri: string): string => {
    return uri.split('/').pop() || 'unknown_filename';
  };

  // Function to get file size
const getFileSize = async (uri: string): Promise<number> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
    
    // Check if the file exists and has the size property
    if (fileInfo.exists && 'size' in fileInfo) {
      return fileInfo.size;
    }
    
    console.log('File does not exist or size property not available:', uri);
    return 0;
  } catch (error) {
    console.error('Error getting file size:', error);
    return 0;
  }
};

  // Function to get mimetype from URI
  const getMimeType = (uri: string): string => {
    // Simple extension based approach, could be enhanced
    const ext = uri.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      default:
        return 'application/octet-stream';
    }
  };

  // Helper function to convert base64 to Blob
  const base64ToBlob = (base64: string, contentType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  };

  // Unified upload function that handles both deduplication and direct upload
  const uploadFile = async (): Promise<void> => {
    if (!image) {
      setStatus({
        message: "Please select an image first!",
        type: "error",
        show: true,
      });
      return;
    }

    setUploading(true);
    setStatus({
      message: "Processing your image...",
      type: "info",
      show: true,
    });

    const filename = getFilenameFromUri(image.uri);
    const fileKey = `${SUBFOLDER}${filename}`;
    const contentType = getMimeType(image.uri);

    try {
      // Set up the S3 upload params
      const params = {
        Bucket: S3_BUCKET,
        Key: fileKey,
        ContentType: contentType,
      };

      // Generate presigned URL
      const command = new PutObjectCommand(params);
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      console.log("Generated upload URL:", uploadUrl);

      const response = await FileSystem.uploadAsync(uploadUrl, image.uri, {
        httpMethod: "PUT",
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          "Content-Type": contentType,
        },
      });
      
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`S3 upload failed with status: ${response.status}`);
      }
      
      // Now check if the image is a duplicate using the Lambda function
      const tagResult = await getImageTag(filename);
      console.log("Tag result after upload:", tagResult);
      
      if (tagResult && tagResult.duplicate) {
        // It's a duplicate
        setDuplicateInfo({
          isDuplicate: true,
          hasTags: tagResult.hasTags || false,
          tags: tagResult.tags || [],
          originalKey: tagResult.originalKey || "",
        });
        
        // Set status based on tag status
        if (tagResult.hasTags) {
          setStatus({
            message: "Duplicate found with tag",
            type: "warning",
            show: true,
          });
        } else {
          setStatus({
            message: "Duplicate found with no tag",
            type: "warning",
            show: true,
          });
        }
      } else {
        // Not a duplicate, poll for tags
        setStatus({
          message: "Image uploaded successfully. Checking for tags...",
          type: "success",
          show: true,
        });
        pollForTag(filename);
      }
    } catch (error) {
      console.error("Upload Error:", error);
      setStatus({
        message: error instanceof Error ? error.message : "Upload error!",
        type: "error",
        show: true
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.title}>Upload Image</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.selectButton} 
            onPress={pickImage}
          >
            <MaterialIcons name="cloud-upload" size={24} color="#3f51b5" />
            <Text style={styles.buttonText}>Select Image</Text>
          </TouchableOpacity>
        </View>
        
        {image && (
          <Text style={styles.fileInfo}>
            {getFilenameFromUri(image.uri)} ({Math.round((image.fileSize || 0) / 1024)} KB)
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.uploadButton,
            (uploading || !image) && styles.disabledButton
          ]}
          onPress={uploadFile}
          disabled={uploading || !image}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload</Text>
          )}
        </TouchableOpacity>

        {/* Duplicate Information Display */}
        {duplicateInfo && (
          <View style={styles.duplicateCard}>
            <View style={styles.duplicateHeader}>
              <MaterialIcons name="warning" size={24} color="#FBC02D" />
              <Text style={styles.duplicateTitle}>Duplicate Image Detected</Text>
            </View>
            
            <Text style={styles.duplicateDescription}>
              This image has already been uploaded before.
            </Text>
            
            <View style={styles.divider} />
            
            {duplicateInfo.hasTags ? (
              <View style={styles.tagsContainer}>
                <Text style={styles.tagsTitle}>Tags from original image:</Text>
                <View style={styles.tagsWrapper}>
                  {duplicateInfo.tags.map((tag, index) => (
                    <View key={index} style={styles.tagChip}>
                      <Text style={styles.tagText}>{`${tag.Key}: ${tag.Value}`}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.noTagsContainer}>
                <MaterialIcons name="info" size={20} color="#2196F3" />
                <Text style={styles.noTagsText}>The original image has no tags.</Text>
              </View>
            )}
            
            <Text style={styles.originalFileText}>
              Original file: {duplicateInfo.originalKey}
            </Text>
          </View>
        )}

        <UploadStatus
          message={status.message}
          type={status.type}
          visible={status.show}
          onClose={() => setStatus({ ...status, show: false })}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonContainer: {
    marginVertical: 16,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#3f51b5',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#3f51b5',
    marginLeft: 8,
  },
  fileInfo: {
    marginVertical: 8,
    fontSize: 14,
    color: '#666',
  },
  uploadButton: {
    backgroundColor: '#3f51b5',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  disabledButton: {
    backgroundColor: '#bdbdbd',
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  duplicateCard: {
    marginTop: 16,
    backgroundColor: '#FFF9C4',
    borderLeftWidth: 4,
    borderLeftColor: '#FBC02D',
    borderRadius: 4,
    padding: 16,
  },
  duplicateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  duplicateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  duplicateDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  tagsContainer: {
    marginTop: 8,
  },
  tagsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
    borderColor: '#3f51b5',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    margin: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#3f51b5',
  },
  noTagsContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noTagsText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#2196F3',
  },
  originalFileText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 8,
  },
});

export default UploadToS3;