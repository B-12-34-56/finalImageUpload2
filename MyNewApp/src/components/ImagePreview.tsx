import React from 'react';
import { 
  View, 
  Image, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ImagePreviewProps {
  imageUrl: string;
  onDelete: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl, onDelete }) => {
  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: imageUrl }} 
        style={styles.image} 
        resizeMode="cover" 
      />
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={onDelete}
      >
        <MaterialIcons name="delete" size={20} color="#333" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    maxWidth: 345,
    width: '100%',
    marginVertical: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 200,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});