import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { uploadImage, ImageInfo } from '../services/uploadService';
import { ImagePreview } from './ImagePreview';
import { UploadStatus } from './UploadStatus';
import { getImageTag } from '../services/getTagService';

export const ImageUploader: React.FC = () => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    show: boolean;
  }>({
    message: '',
    type: 'success',
    show: false,
  });
  const [imageTag, setImageTag] = useState<string | null>(null);

  // Request permissions when component mounts
  React.useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setStatus({
            message: 'Sorry, we need camera roll permissions to make this work!',
            type: 'error',
            show: true,
          });
        }
      }
    })();
  }, []);

  // Poll for the image tag by querying the API endpoint
  const pollForTag = async (filename: string) => {
    const maxAttempts = 10;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const tagResult = await getImageTag(filename);
      if (tagResult && tagResult.tag) {
        clearInterval(interval);
        setImageTag(tagResult.tag); // Save the tag when found
        setStatus({
          message: `Image uploaded successfully with tag "${tagResult.tag}"!`,
          type: 'success',
          show: true,
        });
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        setStatus({
          message: 'Image uploaded successfully but tag was not found.',
          type: 'success',
          show: true,
        });
      }
    }, 3000); // poll every 3 seconds
  };

  const pickImage = async () => {
    if (uploading) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        await handleImageUpload(selectedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setStatus({
        message: 'Failed to select image',
        type: 'error',
        show: true,
      });
    }
  };

  const handleImageUpload = async (uri: string) => {
    setUploading(true);
    
    try {
      // Get filename from URI
      const filename = uri.split('/').pop() || 'image.jpg';
      
      // Create image info object
      const imageInfo: ImageInfo = {
        uri,
        name: filename,
        type: getImageType(filename)
      };
      
      const result = await uploadImage(imageInfo);
      console.log('Upload result:', result);
      
      if (result.success) {
        // Set the uploaded image URI for preview
        setUploadedImage(uri);
        
        // If we got a file path, extract the filename and poll for tag
        if (result.filePath) {
          const parts = result.filePath.split('/');
          const uploadedFilename = parts[parts.length - 1];
          setStatus({
            message: 'Image uploaded successfully! Waiting for tag...',
            type: 'success',
            show: true,
          });
          pollForTag(uploadedFilename);
        } else {
          // If success is true but no filePath is provided, just show success
          setStatus({
            message: 'Image uploaded successfully!',
            type: 'success',
            show: true,
          });
        }
      } else {
        console.error('Upload error: ', result.message);
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setStatus({
        message: error instanceof Error ? error.message : 'Failed to upload image',
        type: 'error',
        show: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const getImageType = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      default:
        return 'image/jpeg';
    }
  };

  const handleDelete = () => {
    setUploadedImage(null);
    setImageTag(null);
  };

  return (
    <View style={styles.container}>
      {!uploadedImage && (
        <TouchableOpacity 
          style={[
            styles.dropzone,
            uploading && styles.dropzoneDisabled
          ]} 
          onPress={pickImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="large" color="#3f51b5" />
          ) : (
            <>
              <MaterialIcons name="cloud-upload" size={48} color="#3f51b5" />
              <Text style={styles.dropzoneText}>
                Tap to select an image
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
      
      {uploadedImage && (
        <ImagePreview imageUrl={uploadedImage} onDelete={handleDelete} />
      )}
      
      {/* Display the image tag if it is found */}
      {imageTag && (
        <UploadStatus
          message={`This image is tagged as: ${imageTag}`}
          type="success"
          visible={true}
          onClose={() => setImageTag(null)}
        />
      )}
      
      <UploadStatus
        message={status.message}
        type={status.type}
        visible={status.show}
        onClose={() => setStatus((prev) => ({ ...prev, show: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: 600,
    width: '100%',
    padding: 16,
    alignSelf: 'center',
  },
  dropzone: {
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  dropzoneDisabled: {
    opacity: 0.6,
  },
  dropzoneText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});