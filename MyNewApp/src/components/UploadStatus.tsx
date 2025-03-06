import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface UploadStatusProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  visible: boolean; // renamed from 'open' to match React Native's Modal prop
  onClose: () => void;
  autoHideDuration?: number;
}

export const UploadStatus: React.FC<UploadStatusProps> = ({
  message,
  type,
  visible,
  onClose,
  autoHideDuration = 6000, // Default to 6 seconds for auto-hide
}) => {
  useEffect(() => {
    // Only auto-hide success and info messages
    if (visible && (type === 'success' || type === 'info') && autoHideDuration) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);
      
      // Clear timeout on unmount
      return () => clearTimeout(timer);
    }
  }, [visible, type, onClose, autoHideDuration]);

  if (!visible) return null;

  // Define icon and colors based on type
  let icon: string;
  let color: string;
  let backgroundColor: string;
  
  switch (type) {
    case 'success':
      icon = 'check-circle';
      color = 'white';
      backgroundColor = '#4CAF50';
      break;
    case 'error':
      icon = 'error';
      color = 'white';
      backgroundColor = '#F44336';
      break;
    case 'warning':
      icon = 'warning';
      color = 'white';
      backgroundColor = '#FF9800';
      break;
    case 'info':
    default:
      icon = 'info';
      color = 'white';
      backgroundColor = '#2196F3';
      break;
  }

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[
          styles.alertContainer, 
          { backgroundColor }
        ]}>
          <View style={styles.content}>
            <MaterialIcons name={icon as any} size={24} color={color} />
            <Text style={styles.message}>{message}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={20} color={color} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end', // Position at bottom
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 50 : 20, // Add padding for iOS
  },
  alertContainer: {
    width: '90%',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  message: {
    marginLeft: 12,
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
});