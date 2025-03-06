import 'react-native-get-random-values';


import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Linking
} from 'react-native';
import UploadToS3 from './src/UploadToS3';

// Comment out the logo placeholder for now
// const logoPlaceholder = require('./assets/logo.png');

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#282c34"
      />
      <View style={styles.header}>
        {/* Remove the Image component until you have a valid image */}
        {/* <Image source={logoPlaceholder} style={styles.logo} /> */}
        
        <Text style={styles.text}>
          Edit <Text style={styles.code}>src/App.tsx</Text> and save to reload.
        </Text>
        <TouchableOpacity
          style={styles.link}
          onPress={() => {
            Linking.openURL('https://reactnative.dev');
          }}
        >
          <Text style={styles.linkText}>Learn React Native</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Filter Slide Upload to S3</Text>
        <UploadToS3 />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: '#282c34',
 },
 header: {
   flex: 1,
   alignItems: 'center',
   justifyContent: 'center',
   padding: 20,
 },
 logo: {
   width: 80,
   height: 80,
   marginBottom: 20,
 },
 text: {
   fontSize: 16,
   color: 'white',
   marginBottom: 20,
   textAlign: 'center',
 },
 code: {
   fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
   backgroundColor: 'rgba(255,255,255,0.1)',
   paddingHorizontal: 4,
   paddingVertical: 2,
   borderRadius: 3,
 },
 link: {
   marginBottom: 30,
 },
 linkText: {
   color: '#61dafb',
   fontSize: 16,
 },
 title: {
   fontSize: 24,
   fontWeight: 'bold',
   color: 'white',
   marginBottom: 20,
 },
});
