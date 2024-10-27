import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as FileSystem from 'expo-file-system';
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

interface State {
  selected: string[];
}

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

export default function GalleryScreen(props: TouchableOpacityProps & { photos?: string[] }) {
  const photos = useLoadedPhotos();
  return <LoadedGalleryScreen {...props} photos={photos.length ? photos : (props.photos ?? [])} />;
}

class LoadedGalleryScreen extends React.Component<
  TouchableOpacityProps & { photos: string[] },
  State
> {
  readonly state: State = {
    selected: [],
  };

  toggleSelection = (uri: string, isSelected: boolean) => {
    this.setState(({ selected }) => {
      if (isSelected) {
        selected.push(uri);
      } else {
        selected = selected.filter((item) => item !== uri);
      }
      return { selected };
    });
  };

  saveToGallery = async () => {
    const photos = this.state.selected;

    if (photos.length > 0) {
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('User has denied the MediaLibrary permissions!');
      }

      const promises = photos.map((photoUri) => {
        return MediaLibrary.createAssetAsync(photoUri);
      });

      await Promise.all(promises);
      alert("Successfully saved photos to user's gallery!");
    } else {
      alert('No photos to save!');
    }
  };

  deletePhotos = async () => {
    const photos = this.state.selected;

    if (photos.length > 0) {
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('User has denied the MediaLibrary permissions!');
      }

      const promises = photos.map((photoUri) => {
        return FileSystem.deleteAsync(photoUri);
      });

      await Promise.all(promises);
      this.setState({ selected: [] });
    } else {
      alert('No photos to delete!');
    }
  };

  renderPhoto = (fileName: string) => (
    <Photo
      key={fileName}
      uri={Platform.select({ web: fileName, default: `${PHOTOS_DIR}/${fileName}` })}
      onSelectionToggle={this.toggleSelection}
    />
  );

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.navbar}>
          <TouchableOpacity style={styles.button} onPress={this.props.onPress}>
            <MaterialIcons name="arrow-back" size={25} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={this.saveToGallery}>
            <Text style={styles.whiteText}>Save selected to gallery</Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center' }}>
          {this.state.selected.length > 0 && (
            <TouchableOpacity style={styles.button} onPress={this.deletePhotos}>
              <Text style={styles.redText}>Delete selected photos</Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView>
          <View style={styles.pictures}>{this.props.photos.map(this.renderPhoto)}</View>
        </ScrollView>
      </View>
    );
  }
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
