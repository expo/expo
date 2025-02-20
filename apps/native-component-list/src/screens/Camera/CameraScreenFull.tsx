import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import {
  BarcodePoint,
  BarcodeScanningResult,
  CameraView,
  CameraCapturedPicture,
  CameraMode,
  CameraType,
  FlashMode,
  PermissionStatus,
  Camera,
  FocusMode,
} from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Svg from 'react-native-svg';

import GalleryScreen from './GalleryScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('screen');

const flashModeOrder: Record<string, FlashMode> = {
  off: 'on',
  on: 'auto',
  auto: 'off',
};

const flashIcons: Record<string, string> = {
  off: 'flash-off',
  on: 'flash',
  auto: 'flash-outline',
};

const volumeIcons: Record<string, string> = {
  on: 'volume-high',
  off: 'volume-mute',
};

const photos: CameraCapturedPicture[] = [];

interface State {
  flash: FlashMode;
  zoom: number;
  facing: CameraType;
  barcodeScanning: boolean;
  mute: boolean;
  torchEnabled: boolean;
  cornerPoints?: BarcodePoint[];
  mirror?: boolean;
  autoFocus: FocusMode;
  barcodeData: string;
  newPhotos: boolean;
  previewPaused: boolean;
  permissionsGranted: boolean;
  micPermissionsGranted: boolean;
  permission?: PermissionStatus;
  micPermission?: PermissionStatus;
  pictureSize?: string;
  pictureSizes: string[];
  pictureSizeId: number;
  showGallery: boolean;
  showMoreOptions: boolean;
  mode: CameraMode;
  recording: boolean;
}

function Gestures({ children }: { children: React.ReactNode }) {
  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(250)
        .onStart(() => {
          console.log('doubleTapGesture > onStart');
        }),
    []
  );

  const longPressGesture = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(750)
        .onStart(() => {
          console.log('longPressGesture > onStart');
        }),
    []
  );

  if (Platform.OS === 'web') {
    return children;
  }

  return (
    <GestureDetector gesture={Gesture.Race(doubleTapGesture, longPressGesture)}>
      {children}
    </GestureDetector>
  );
}
export default function CameraScreen() {
  const camera = useRef<CameraView>(null);
  const [state, setState] = useState<State>({
    flash: 'off',
    zoom: 0,
    facing: 'back',
    barcodeScanning: false,
    torchEnabled: false,
    cornerPoints: undefined,
    mute: false,
    mirror: false,
    barcodeData: '',
    autoFocus: 'off',
    newPhotos: false,
    previewPaused: false,
    permissionsGranted: false,
    micPermissionsGranted: false,
    showGallery: false,
    showMoreOptions: false,
    pictureSizes: [],
    pictureSizeId: 0,
    mode: 'picture',
    recording: false,
  });

  useEffect(() => {
    if (Platform.OS !== 'web') {
      ensureDirectoryExistsAsync();
    }
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setState((state) => ({
        ...state,
        permission: status,
        permissionsGranted: status === 'granted',
      }));
    });

    Camera.requestMicrophonePermissionsAsync().then(({ status }) => {
      setState((state) => ({
        ...state,
        micPermission: status,
        micPermissionsGranted: status === 'granted',
      }));
    });
  }, []);

  const ensureDirectoryExistsAsync = async () => {
    try {
      await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'photos');
    } catch {
      // Directory exists
    }
  };

  const toggleView = () =>
    setState((state) => ({ ...state, showGallery: !state.showGallery, newPhotos: false }));

  const toggleMoreOptions = () =>
    setState((state) => ({ ...state, showMoreOptions: !state.showMoreOptions }));

  const toggleFacing = () =>
    setState((state) => ({ ...state, facing: state.facing === 'back' ? 'front' : 'back' }));

  const toggleFlash = () => setState((state) => ({ ...state, flash: flashModeOrder[state.flash] }));

  const togglePreviewPaused = () =>
    setState((state) => ({ ...state, previewPaused: !state.previewPaused }));

  const toggleTorch = () => setState((state) => ({ ...state, torchEnabled: !state.torchEnabled }));

  const toggleMute = () => setState((state) => ({ ...state, mute: !state.mute }));

  const toggleMirror = () => setState((state) => ({ ...state, mirror: !state.mirror }));

  const toggleBarcodeScanning = () =>
    setState((state) => ({ ...state, barcodeScanning: !state.barcodeScanning }));

  const toggleFocus = () =>
    setState((state) => ({
      ...state,
      autoFocus: state.autoFocus === 'on' ? 'off' : 'on',
    }));

  const collectPictureSizes = async () => {
    if (state.pictureSizes.length > 0) {
      return;
    }
    const pictureSizes = (await camera?.current?.getAvailablePictureSizesAsync()) || [];
    let pictureSizeId = 0;
    if (Platform.OS === 'ios') {
      pictureSizeId = pictureSizes.indexOf('Photo');
    } else {
      pictureSizeId = pictureSizes.length - 1;
    }
    setState((state) => ({
      ...state,
      pictureSizes,
      pictureSizeId,
      pictureSize: pictureSizes[pictureSizeId],
    }));
  };

  const previousPictureSize = () => changePictureSize(1);
  const nextPictureSize = () => changePictureSize(-1);

  const changePictureSize = (direction: number) => {
    setState((state) => {
      let newId = state.pictureSizeId + direction;
      const length = state.pictureSizes.length;
      if (newId >= length) {
        newId = 0;
      } else if (newId < 0) {
        newId = length - 1;
      }
      return {
        ...state,
        pictureSize: state.pictureSizes[newId],
        pictureSizeId: newId,
      };
    });
  };

  const takePicture = async () => {
    await camera?.current?.takePictureAsync({
      onPictureSaved,
      shutterSound: !state.mute,
    });
  };

  const recordVideo = async () => {
    setState((state) => ({ ...state, recording: !state.recording }));
    if (state.recording) {
      camera?.current?.stopRecording();
      return Promise.resolve();
    } else {
      return camera?.current?.recordAsync();
    }
  };

  const takeVideo = async () => {
    try {
      const result = await recordVideo();
      setState((state) => ({ ...state, recording: !state.recording }));
      if (result?.uri) {
        await FileSystem.moveAsync({
          from: result.uri,
          to: `${FileSystem.documentDirectory}photos/${Date.now()}.${result.uri.split('.')[1]}`,
        });
      }
    } catch (error) {
      console.log(error);
      setState((state) => ({ ...state, recording: false }));
    }
  };

  const updatePreviewState = () => {
    if (state.previewPaused) {
      camera?.current?.resumePreview();
    } else {
      camera?.current?.pausePreview();
    }
    togglePreviewPaused();
  };

  const changeMode = () => {
    setState((state) => ({ ...state, mode: state.mode === 'picture' ? 'video' : 'picture' }));
  };

  const handleMountError = ({ message }: { message: string }) => console.error(message);

  const onPictureSaved = async (photo: CameraCapturedPicture) => {
    if (Platform.OS === 'web') {
      photos.push(photo);
    } else {
      await FileSystem.moveAsync({
        from: photo.uri,
        to: `${FileSystem.documentDirectory}photos/${Date.now()}.jpg`,
      });
    }
    setState((state) => ({ ...state, newPhotos: true }));
  };

  const onBarcodeScanned = (code: BarcodeScanningResult) => {
    console.log('Found: ', code);
    setState((state) => ({
      ...state,
      barcodeData: code.data,
      cornerPoints: code.cornerPoints,
    }));
  };

  const renderGallery = () => {
    return <GalleryScreen onPress={toggleView} />;
  };

  const renderNoPermissions = () => (
    <View style={styles.noPermissions}>
      {state.permission && (
        <View>
          <Text style={{ color: '#4630ec', fontWeight: 'bold', textAlign: 'center', fontSize: 24 }}>
            Permission {state.permission.toLowerCase()}!
          </Text>
          <Text style={{ color: '#595959', textAlign: 'center', fontSize: 20 }}>
            You'll need to enable the camera permission to continue.
          </Text>
        </View>
      )}
    </View>
  );

  const renderTopBar = () => (
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.toggleButton} onPress={toggleFacing}>
        <Ionicons name="camera-reverse" size={32} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={toggleFlash}>
        <Ionicons name={flashIcons[state.flash] as any} size={28} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={toggleMute}>
        <Ionicons name={volumeIcons[state.mute ? 'off' : 'on'] as any} size={28} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={toggleTorch}>
        <Ionicons name="flashlight" size={28} color={state.torchEnabled ? 'white' : '#858585'} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={toggleFocus}>
        <Text
          style={[
            styles.autoFocusLabel,
            { color: state.autoFocus === 'on' ? 'white' : '#6b6b6b' },
          ]}>
          AF
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={toggleMirror}>
        <MaterialCommunityIcons
          name="mirror"
          size={24}
          color={state.mirror ? 'white' : '#858585'}
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={updatePreviewState}>
        {state.previewPaused ? (
          <AntDesign name="playcircleo" size={24} color="white" />
        ) : (
          <AntDesign name="pausecircleo" size={24} color="white" />
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={toggleMoreOptions}>
        <MaterialCommunityIcons name="dots-horizontal" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderBottomBar = () => (
    <View style={{ alignItems: 'center' }}>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomButton} onPress={changeMode}>
          <MaterialCommunityIcons
            name={state.mode === 'picture' ? 'image' : 'video'}
            size={32}
            color="white"
          />
        </TouchableOpacity>
        <View style={{ flex: 0.4 }}>
          <TouchableOpacity
            onPress={state.mode === 'picture' ? takePicture : takeVideo}
            style={{ alignSelf: 'center' }}>
            {state.recording ? (
              <MaterialCommunityIcons name="stop-circle" size={64} color="red" />
            ) : (
              <Ionicons
                name="radio-button-on"
                size={64}
                color={state.mode === 'picture' ? 'white' : 'red'}
              />
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.bottomButton} onPress={toggleView}>
          <View>
            <MaterialCommunityIcons name="apps" size={32} color="white" />
            {state.newPhotos && <View style={styles.newPhotosDot} />}
          </View>
        </TouchableOpacity>
      </View>
      <Slider
        minimumValue={0}
        maximumValue={1.0}
        step={0.1}
        style={{ width: SCREEN_WIDTH - 20, height: 30 }}
        onValueChange={(v) => setState((s) => ({ ...s, zoom: parseFloat(v.toFixed(1)) }))}
      />
    </View>
  );

  const renderMoreOptions = () => (
    <View style={styles.options}>
      <View style={styles.detectors}>
        <TouchableOpacity onPress={toggleBarcodeScanning}>
          <MaterialCommunityIcons
            name="barcode-scan"
            size={32}
            color={state.barcodeScanning ? 'white' : '#858585'}
          />
          <Text style={{ color: state.barcodeScanning ? 'white' : '#858585' }}>Code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pictureSizeContainer}>
        <Text style={styles.pictureQualityLabel}>Picture quality</Text>
        <View style={styles.pictureSizeChooser}>
          <TouchableOpacity onPress={previousPictureSize} style={{ padding: 6 }}>
            <Ionicons name="arrow-back" size={14} color="white" />
          </TouchableOpacity>
          <View style={styles.pictureSizeLabel}>
            <Text style={{ color: 'white' }}>{state.pictureSize}</Text>
          </View>
          <TouchableOpacity onPress={nextPictureSize} style={{ padding: 6 }}>
            <Ionicons name="arrow-forward" size={14} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderBarcode = () => {
    const origin: BarcodePoint | undefined = state.cornerPoints ? state.cornerPoints[0] : undefined;
    return (
      <Svg.Svg style={styles.barcode} pointerEvents="none">
        {origin && (
          <Svg.Text fill="#CF4048" stroke="#CF4048" fontSize="14" x={origin.x} y={origin.y - 8}>
            {state.barcodeData}
          </Svg.Text>
        )}

        <Svg.Polygon
          points={state.cornerPoints?.map((coord) => `${coord.x},${coord.y}`).join(' ')}
          stroke="red"
          strokeWidth={5}
        />
      </Svg.Svg>
    );
  };

  const renderCamera = () => (
    <View style={{ flex: 1 }}>
      <Gestures>
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <CameraView
            ref={camera}
            style={StyleSheet.absoluteFill}
            onCameraReady={collectPictureSizes}
            responsiveOrientationWhenOrientationLocked
            enableTorch={state.torchEnabled}
            autofocus={state.autoFocus}
            facing={state.facing}
            animateShutter
            mirror={state.mirror}
            pictureSize={state.pictureSize}
            flash={state.flash}
            active
            mode={state.mode}
            mute={state.mute}
            zoom={state.zoom}
            videoQuality="1080p"
            onMountError={handleMountError}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'pdf417'],
            }}
            onBarcodeScanned={state.barcodeScanning ? onBarcodeScanned : undefined}
          />
          {renderTopBar()}
          {renderBottomBar()}
        </View>
      </Gestures>
      {state.barcodeScanning && renderBarcode()}
      {state.showMoreOptions && renderMoreOptions()}
    </View>
  );

  const cameraScreenContent = state.permissionsGranted ? renderCamera() : renderNoPermissions();
  const content = state.showGallery ? renderGallery() : cameraScreenContent;
  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bottomBar: {
    paddingBottom: 12,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  noPermissions: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f8fdff',
  },
  gallery: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  toggleButton: {
    flex: 0.25,
    height: 40,
    marginHorizontal: 2,
    marginBottom: 10,
    marginTop: 20,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoFocusLabel: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bottomButton: {
    flex: 0.3,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newPhotosDot: {
    position: 'absolute',
    top: 0,
    right: -5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4630EB',
  },
  options: {
    position: 'absolute',
    top: 84,
    right: 24,
    width: 200,
    backgroundColor: '#000000BA',
    borderRadius: 4,
    padding: 16,
  },
  detectors: {
    flex: 0.5,
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row',
  },
  pictureQualityLabel: {
    fontSize: 10,
    marginVertical: 3,
    color: 'white',
  },
  pictureSizeContainer: {
    flex: 0.5,
    alignItems: 'center',
    paddingTop: 10,
  },
  pictureSizeChooser: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  pictureSizeLabel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facesContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
  },
  row: {
    flexDirection: 'row',
  },
  barcode: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'red',
  },
});
