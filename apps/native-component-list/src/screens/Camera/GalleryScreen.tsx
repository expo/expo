import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CameraCapturedPicture } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  Platform,
} from 'react-native';

import Photo from './Photo';

const PHOTOS_DIR = FileSystem.documentDirectory + 'photos';

function useLoadedPhotos() {
  const [photos, setPhotos] = React.useState<string[]>([]);

  React.useEffect(() => {
    let isMounted = true;
    if (Platform.OS !== 'web') {
      FileSystem.readDirectoryAsync(PHOTOS_DIR).then((photos) => {
        if (isMounted) {
          setPhotos(photos);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, []);
  return photos;
}

export default function GalleryScreen(
  props: TouchableOpacityProps & { photos?: CameraCapturedPicture[] }
) {
  const photos = useLoadedPhotos();
  const uris = props.photos?.map((photo) => photo.uri) ?? [];
  return <LoadedGalleryScreen {...props} photos={photos.length ? photos : uris} />;
}

function LoadedGalleryScreen(props: TouchableOpacityProps & { photos: string[] }) {
  const [selectedPhotos, setSelectedPhotos] = React.useState<string[]>([]);

  const toggleSelection = (uri: string, isSelected: boolean) => {
    setSelectedPhotos((selected) => {
      let result = [];
      if (isSelected) {
        result = [...selected, uri];
      } else {
        result = selected.filter((item) => item !== uri);
      }
      return result;
    });
  };

  const saveToGallery = async () => {
    if (selectedPhotos.length > 0) {
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('User has denied the MediaLibrary permissions!');
      }

      const promises = selectedPhotos.map((photoUri) => {
        return MediaLibrary.createAssetAsync(photoUri);
      });

      await Promise.all(promises);
      alert("Successfully saved photos to user's gallery!");
    } else {
      alert('No photos to save!');
    }
  };

  const deletePhotos = async () => {
    if (selectedPhotos.length > 0) {
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('User has denied the MediaLibrary permissions!');
      }

      const promises = selectedPhotos.map((photoUri) => {
        return FileSystem.deleteAsync(photoUri);
      });

      await Promise.all(promises);
      setSelectedPhotos([]);
    } else {
      alert('No photos to delete!');
    }
  };

  const renderPhoto = (fileName: string) => (
    <Photo
      key={fileName}
      uri={Platform.select({ web: fileName, default: `${PHOTOS_DIR}/${fileName}` })}
      onSelectionToggle={toggleSelection}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.button} onPress={props.onPress}>
          <MaterialIcons name="arrow-back" size={25} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={saveToGallery}>
          <Text style={styles.whiteText}>Save selected to gallery</Text>
        </TouchableOpacity>
      </View>
      <View style={{ alignItems: 'center' }}>
        {selectedPhotos.length > 0 && (
          <TouchableOpacity style={styles.button} onPress={deletePhotos}>
            <Text style={styles.redText}>Delete selected photos</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView>
        <View style={styles.pictures}>{props.photos.map(renderPhoto)}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4630EB',
  },
  pictures: {
    flex: 1,
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  button: {
    padding: 20,
  },
  whiteText: {
    color: 'white',
  },
  redText: {
    color: 'red',
    fontWeight: '700',
  },
});
