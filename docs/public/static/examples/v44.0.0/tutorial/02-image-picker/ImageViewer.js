import { StyleSheet, Image } from 'react-native';

export default function ImageViewer({ placeholderImageSource, selectedImage }) {
  return (    
      <Image
        source={selectedImage !== null ? { uri: selectedImage } : placeholderImageSource}
        style={styles.image}
      />    
  );
}

const styles = StyleSheet.create({  
  image: {
    width: 320,
    height: 440,
    borderRadius: 18,
  },
});
