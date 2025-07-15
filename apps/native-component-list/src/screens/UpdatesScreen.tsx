import * as Updates from 'expo-updates';
import React from 'react';
import { ScrollView, StyleSheet, Text, View, Alert } from 'react-native';

import Button from '../components/Button';

export default function UpdatesScreen() {
  const getRandomColor = () => {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#F39C12',
      '#E74C3C',
      '#9B59B6',
      '#2ECC71',
      '#3498DB',
      '#E67E22',
      '#1ABC9C',
      '#F1C40F',
      '#8E44AD',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getRandomSpinnerColor = () => {
    const colors = [
      '#007AFF',
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#F39C12',
      '#E74C3C',
      '#9B59B6',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleShowReloadScreen = async () => {
    try {
      await Updates.showReloadScreen();
      setTimeout(async () => {
        try {
          await Updates.hideReloadScreen();
        } catch {}
      }, 3000);
    } catch (error) {
      Alert.alert('Error', `Failed to show reload screen: ${error.message}`);
    }
  };

  const setDefaultOptions = () => {
    Updates.setReloadScreenOptions({
      backgroundColor: getRandomColor(),
      spinner: {
        enabled: true,
        color: getRandomSpinnerColor(),
        size: 'medium',
      },
    });
  };

  const setDarkOptions = () => {
    Updates.setReloadScreenOptions({
      backgroundColor: '#1a1a1a',
      fade: true,
      spinner: {
        enabled: true,
        color: '#ffffff',
        size: 'large',
      },
    });
  };

  const setLocalImageOptions = () => {
    Updates.setReloadScreenOptions({
      backgroundColor: getRandomColor(),
      image: require('../../assets/images/react-native.png'),
      imageResizeMode: 'contain',
    });
  };

  const setRemoteUrlImageOptions = () => {
    Updates.setReloadScreenOptions({
      backgroundColor: getRandomColor(),
      image: {
        url: 'https://picsum.photos/200/200',
        height: 200,
        width: 200,
      },
      imageResizeMode: 'contain',
    });
  };

  const setFullScreenImageOptions = () => {
    Updates.setReloadScreenOptions({
      backgroundColor: getRandomColor(),
      image: require('../../assets/images/large-example.jpg'),
      imageResizeMode: 'cover',
      imageFullScreen: true,
      fade: true,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Button onPress={handleShowReloadScreen} title="Show Reload Screen" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration Options</Text>
        <Button onPress={setDefaultOptions} title="Set Default Options" />
        <Button onPress={setDarkOptions} title="Set Dark Theme Options" />
        <Button onPress={setLocalImageOptions} title="Set Local Image Options" />
        <Button onPress={setRemoteUrlImageOptions} title="Set Remote Image Options" />
        <Button onPress={setFullScreenImageOptions} title="Set Full Screen Image Options" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  info: {
    fontSize: 12,
    marginBottom: 4,
    color: '#666',
  },
  instructions: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
