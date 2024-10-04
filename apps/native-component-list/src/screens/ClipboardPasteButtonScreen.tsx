import * as Clipboard from 'expo-clipboard';
import { ClipboardPasteButton, TextPasteEvent, ImagePasteEvent } from 'expo-clipboard';
import React from 'react';
import { Text, View, StyleSheet, Image } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

const available = Clipboard.isPasteButtonAvailable;

export default function ClipboardPasteButtonScreen() {
  const [textData, setTextData] = React.useState<TextPasteEvent | null>(null);
  const [imageData, setImageData] = React.useState<ImagePasteEvent | null>(null);

  if (!available) {
    return (
      <View style={styles.screen}>
        <Text>ClipboardPasteButton is not available on this device</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={styles.screen}>
        <Text selectable>Random text you can copy</Text>
        <ClipboardPasteButton
          imageOptions={{ format: 'png' }}
          onPress={(data) => {
            if (data.type === 'image') {
              setImageData(data);
            } else {
              setTextData(data);
            }
          }}
          style={styles.buttonStyle}
        />
        {textData && (
          <View style={styles.sectionContainer}>
            <Text style={styles.heading}>Text Paste Result:</Text>

            <View style={styles.textResult}>
              <Text style={{ textAlign: 'center' }}>{textData.text}</Text>
            </View>
          </View>
        )}
        {imageData && (
          <View style={styles.sectionContainer}>
            <Text style={styles.heading}>Image Paste Result:</Text>
            <Image source={{ uri: imageData.data }} style={styles.image} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    padding: 20,
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionContainer: {
    alignItems: 'center',
    gap: 5,
  },
  image: {
    width: 200,
    aspectRatio: 1,
    borderRadius: 10,
  },
  buttonStyle: {
    width: 120,
    height: 50,
  },
  textResult: {
    backgroundColor: 'white',
    padding: 10,
    borderWidth: 1,
    borderColor: 'black',
  },
});
