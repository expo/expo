import SegmentedControl from '@react-native-segmented-control/segmented-control';
import * as ImagePicker from 'expo-image-picker';
import { LivePhotoAsset, LivePhotoView, ContentFit, LivePhotoViewType } from 'expo-live-photo';
import { useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';

import Button from '../components/Button';
import TitledSwitch from '../components/TitledSwitch';

export default function LivePhotoScreen() {
  const viewRef = useRef<LivePhotoViewType>(null);
  const [livePhoto, setLivePhoto] = useState<LivePhotoAsset | null>(null);
  const [contentFit, setContentFit] = useState<ContentFit>('contain');
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [useDefaultGestureRecognizer, setUseDefaultGestureRecognizer] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['livePhotos'],
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0].pairedVideoAsset?.uri) {
      setLivePhoto({
        photoUri: result.assets[0].uri,
        pairedVideoUri: result.assets[0].pairedVideoAsset.uri,
      });
    } else {
      console.error('Failed to pick a live photo');
    }
  };

  if (!LivePhotoView.isAvailable()) {
    return (
      <View style={styles.container}>
        <Text>expo-live-photo is not available on this platform 😕</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LivePhotoView
        ref={viewRef}
        source={livePhoto}
        contentFit={contentFit}
        useDefaultGestureRecognizer={useDefaultGestureRecognizer}
        style={[styles.livePhotoView, { display: isLoaded ? 'flex' : 'none' }]}
        isMuted={isMuted}
        onLoadStart={() => {
          console.log('Loading');
        }}
        onLoadComplete={() => {
          setIsLoaded(true);
          console.log('Live Photo loaded');
        }}
        onPlaybackStart={() => {
          console.log('Playing');
        }}
        onPreviewPhotoLoad={() => {
          console.log('Preview photo loaded');
        }}
        onLoadError={(error) => {
          setIsLoaded(false);
          console.log('Error: ', error.message);
        }}
        onPlaybackStop={() => {
          console.log('Stopped');
        }}
      />
      <Button
        title={isLoaded ? 'Change Image' : 'Pick an image'}
        onPress={pickImage}
        style={isLoaded ? styles.pickImageCollapsed : styles.pickImageExpanded}
      />
      <Button
        title="Start Playback Hint"
        onPress={() => viewRef.current?.startPlayback('hint')}
        style={styles.button}
      />
      <Button
        title="Start Playback"
        onPress={() => viewRef.current?.startPlayback('full')}
        style={styles.button}
      />
      <Button
        title="Stop Playback"
        onPress={() => viewRef.current?.stopPlayback()}
        style={styles.button}
      />
      <TitledSwitch value={isMuted} setValue={setIsMuted} title="Is muted" />
      <TitledSwitch
        value={useDefaultGestureRecognizer}
        setValue={setUseDefaultGestureRecognizer}
        title="Use default gesture recognizer"
      />
      <Text style={styles.titleStyle}>Content Fit</Text>
      <SegmentedControl
        values={['contain', 'cover']}
        selectedIndex={0}
        onChange={(event) => {
          setContentFit(event.nativeEvent.selectedSegmentIndex === 0 ? 'contain' : 'cover');
          console.log(
            'ContentFit:',
            event.nativeEvent.selectedSegmentIndex === 0 ? 'contain' : 'cover'
          );
        }}
        style={styles.segmentedControl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  livePhotoView: {
    alignSelf: 'stretch',
    height: 300,
  },
  titleStyle: {
    fontWeight: 'bold',
  },
  segmentedControl: {
    marginVertical: 10,
    alignSelf: 'stretch',
  },
  pickImageExpanded: {
    alignSelf: 'stretch',
    height: 300,
  },
  pickImageCollapsed: {
    marginVertical: 3,
  },
  button: {
    marginVertical: 3,
  },
});
