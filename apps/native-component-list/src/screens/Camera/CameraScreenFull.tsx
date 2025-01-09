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
import React, { useMemo } from 'react';
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
export default class CameraScreen extends React.Component<object, State> {
  camera? = React.createRef<CameraView>();

  readonly state: State = {
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
  };

  componentDidMount() {
    if (Platform.OS !== 'web') {
      this.ensureDirectoryExistsAsync();
    }
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      this.setState({ permission: status, permissionsGranted: status === 'granted' });
    });

    Camera.requestMicrophonePermissionsAsync().then(({ status }) => {
      this.setState({ micPermission: status, micPermissionsGranted: status === 'granted' });
    });
  }

  async ensureDirectoryExistsAsync() {
    try {
      await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'photos');
    } catch {
      // Directory exists
    }
  }

  toggleView = () =>
    this.setState((state) => ({ showGallery: !state.showGallery, newPhotos: false }));

  toggleMoreOptions = () => this.setState((state) => ({ showMoreOptions: !state.showMoreOptions }));

  toggleFacing = () =>
    this.setState((state) => ({
      facing: state.facing === 'back' ? 'front' : 'back',
    }));

  toggleFlash = () => this.setState((state) => ({ flash: flashModeOrder[state.flash] }));

  togglePreviewPaused = () => this.setState((state) => ({ previewPaused: !state.previewPaused }));

  toggleTorch = () => this.setState((state) => ({ torchEnabled: !state.torchEnabled }));

  toggleMute = () => this.setState((state) => ({ mute: !state.mute }));

  toggleMirror = () => this.setState((state) => ({ mirror: !state.mirror }));

  zoomOut = () => this.setState((state) => ({ zoom: state.zoom - 0.1 < 0 ? 0 : state.zoom - 0.1 }));

  zoomIn = () => this.setState((state) => ({ zoom: state.zoom + 0.1 > 1 ? 1 : state.zoom + 0.1 }));

  toggleBarcodeScanning = () =>
    this.setState((state) => ({ barcodeScanning: !state.barcodeScanning }));

  toggleFocus = () =>
    this.setState((state) => ({
      autoFocus: state.autoFocus === 'on' ? 'off' : 'on',
    }));

  collectPictureSizes = async () => {
    if (this.state.pictureSizes.length > 0) {
      return;
    }
    const pictureSizes = (await this.camera?.current?.getAvailablePictureSizesAsync()) || [];
    let pictureSizeId = 0;
    if (Platform.OS === 'ios') {
      pictureSizeId = pictureSizes.indexOf('Photo');
    } else {
      pictureSizeId = pictureSizes.length - 1;
    }
    this.setState({ pictureSizes, pictureSizeId, pictureSize: pictureSizes[pictureSizeId] });
  };

  previousPictureSize = () => this.changePictureSize(1);
  nextPictureSize = () => this.changePictureSize(-1);

  changePictureSize = (direction: number) => {
    this.setState((state) => {
      let newId = state.pictureSizeId + direction;
      const length = state.pictureSizes.length;
      if (newId >= length) {
        newId = 0;
      } else if (newId < 0) {
        newId = length - 1;
      }
      return {
        pictureSize: state.pictureSizes[newId],
        pictureSizeId: newId,
      };
    });
  };

  takePicture = async () => {
    await this.camera?.current?.takePictureAsync({
      onPictureSaved: this.onPictureSaved,
      shutterSound: !this.state.mute,
    });
  };

  recordVideo = async () => {
    this.setState((state) => ({ recording: !state.recording }));
    if (this.state.recording) {
      this.camera?.current?.stopRecording();
      return Promise.resolve();
    } else {
      return this.camera?.current?.recordAsync();
    }
  };

  takeVideo = async () => {
    try {
      const result = await this.recordVideo();
      this.setState((state) => ({ recording: !state.recording }));
      if (result?.uri) {
        await FileSystem.moveAsync({
          from: result.uri,
          to: `${FileSystem.documentDirectory}photos/${Date.now()}.${result.uri.split('.')[1]}`,
        });
      }
    } catch (error) {
      console.log(error);
      this.setState(() => ({ recording: false }));
    }
  };

  updatePreviewState = () => {
    if (this.state.previewPaused) {
      this.camera?.current?.resumePreview();
    } else {
      this.camera?.current?.pausePreview();
    }
    this.togglePreviewPaused();
  };

  changeMode = () => {
    this.setState((state) => ({ mode: state.mode === 'picture' ? 'video' : 'picture' }));
  };

  handleMountError = ({ message }: { message: string }) => console.error(message);

  onPictureSaved = async (photo: CameraCapturedPicture) => {
    if (Platform.OS === 'web') {
      photos.push(photo);
    } else {
      await FileSystem.moveAsync({
        from: photo.uri,
        to: `${FileSystem.documentDirectory}photos/${Date.now()}.jpg`,
      });
    }
    this.setState({ newPhotos: true });
  };

  onBarcodeScanned = (code: BarcodeScanningResult) => {
    console.log('Found: ', code);
    this.setState(() => ({
      barcodeData: code.data,
      cornerPoints: code.cornerPoints,
    }));
  };

  renderGallery() {
    return <GalleryScreen onPress={this.toggleView} />;
  }

  renderNoPermissions = () => (
    <View style={styles.noPermissions}>
      {this.state.permission && (
        <View>
          <Text style={{ color: '#4630ec', fontWeight: 'bold', textAlign: 'center', fontSize: 24 }}>
            Permission {this.state.permission.toLowerCase()}!
          </Text>
          <Text style={{ color: '#595959', textAlign: 'center', fontSize: 20 }}>
            You'll need to enable the camera permission to continue.
          </Text>
        </View>
      )}
    </View>
  );

  renderTopBar = () => (
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.toggleButton} onPress={this.toggleFacing}>
        <Ionicons name="camera-reverse" size={32} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={this.toggleFlash}>
        <Ionicons name={flashIcons[this.state.flash] as any} size={28} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={this.toggleMute}>
        <Ionicons
          name={volumeIcons[this.state.mute ? 'off' : 'on'] as any}
          size={28}
          color="white"
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={this.toggleTorch}>
        <Ionicons
          name="flashlight"
          size={28}
          color={this.state.torchEnabled ? 'white' : '#858585'}
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={this.toggleFocus}>
        <Text
          style={[
            styles.autoFocusLabel,
            { color: this.state.autoFocus === 'on' ? 'white' : '#6b6b6b' },
          ]}>
          AF
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={this.toggleMirror}>
        <MaterialCommunityIcons
          name="mirror"
          size={24}
          color={this.state.mirror ? 'white' : '#858585'}
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={this.updatePreviewState}>
        {this.state.previewPaused ? (
          <AntDesign name="playcircleo" size={24} color="white" />
        ) : (
          <AntDesign name="pausecircleo" size={24} color="white" />
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={this.toggleMoreOptions}>
        <MaterialCommunityIcons name="dots-horizontal" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );

  renderBottomBar = () => (
    <View style={{ alignItems: 'center' }}>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomButton} onPress={this.changeMode}>
          <MaterialCommunityIcons
            name={this.state.mode === 'picture' ? 'image' : 'video'}
            size={32}
            color="white"
          />
        </TouchableOpacity>
        <View style={{ flex: 0.4 }}>
          <TouchableOpacity
            onPress={this.state.mode === 'picture' ? this.takePicture : this.takeVideo}
            style={{ alignSelf: 'center' }}>
            {this.state.recording ? (
              <MaterialCommunityIcons name="stop-circle" size={64} color="red" />
            ) : (
              <Ionicons
                name="radio-button-on"
                size={64}
                color={this.state.mode === 'picture' ? 'white' : 'red'}
              />
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.bottomButton} onPress={this.toggleView}>
          <View>
            <MaterialCommunityIcons name="apps" size={32} color="white" />
            {this.state.newPhotos && <View style={styles.newPhotosDot} />}
          </View>
        </TouchableOpacity>
      </View>
      <Slider
        minimumValue={0}
        maximumValue={1.0}
        step={0.1}
        style={{ width: SCREEN_WIDTH - 20, height: 30 }}
        onValueChange={(v) => this.setState({ zoom: parseFloat(v.toFixed(1)) })}
      />
    </View>
  );

  renderMoreOptions = () => (
    <View style={styles.options}>
      <View style={styles.detectors}>
        <TouchableOpacity onPress={this.toggleBarcodeScanning}>
          <MaterialCommunityIcons
            name="barcode-scan"
            size={32}
            color={this.state.barcodeScanning ? 'white' : '#858585'}
          />
          <Text style={{ color: this.state.barcodeScanning ? 'white' : '#858585' }}>Code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pictureSizeContainer}>
        <Text style={styles.pictureQualityLabel}>Picture quality</Text>
        <View style={styles.pictureSizeChooser}>
          <TouchableOpacity onPress={this.previousPictureSize} style={{ padding: 6 }}>
            <Ionicons name="arrow-back" size={14} color="white" />
          </TouchableOpacity>
          <View style={styles.pictureSizeLabel}>
            <Text style={{ color: 'white' }}>{this.state.pictureSize}</Text>
          </View>
          <TouchableOpacity onPress={this.nextPictureSize} style={{ padding: 6 }}>
            <Ionicons name="arrow-forward" size={14} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  renderBarcode = () => {
    const origin: BarcodePoint | undefined = this.state.cornerPoints
      ? this.state.cornerPoints[0]
      : undefined;
    return (
      <Svg.Svg style={styles.barcode} pointerEvents="none">
        {origin && (
          <Svg.Text fill="#CF4048" stroke="#CF4048" fontSize="14" x={origin.x} y={origin.y - 8}>
            {this.state.barcodeData}
          </Svg.Text>
        )}

        <Svg.Polygon
          points={this.state.cornerPoints?.map((coord) => `${coord.x},${coord.y}`).join(' ')}
          stroke="red"
          strokeWidth={5}
        />
      </Svg.Svg>
    );
  };

  renderCamera = () => (
    <View style={{ flex: 1 }}>
      <Gestures>
        <CameraView
          ref={this.camera}
          style={styles.camera}
          onCameraReady={this.collectPictureSizes}
          responsiveOrientationWhenOrientationLocked
          enableTorch={this.state.torchEnabled}
          autofocus={this.state.autoFocus}
          facing={this.state.facing}
          animateShutter
          mirror={this.state.mirror}
          pictureSize={this.state.pictureSize}
          flash={this.state.flash}
          active
          mode={this.state.mode}
          mute={this.state.mute}
          zoom={this.state.zoom}
          videoQuality="1080p"
          onMountError={this.handleMountError}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'pdf417'],
          }}
          onBarcodeScanned={this.state.barcodeScanning ? this.onBarcodeScanned : undefined}>
          {this.renderTopBar()}
          {this.renderBottomBar()}
        </CameraView>
      </Gestures>
      {this.state.barcodeScanning && this.renderBarcode()}
      {this.state.showMoreOptions && this.renderMoreOptions()}
    </View>
  );

  render() {
    const cameraScreenContent = this.state.permissionsGranted
      ? this.renderCamera()
      : this.renderNoPermissions();
    const content = this.state.showGallery ? this.renderGallery() : cameraScreenContent;
    return <View style={styles.container}>{content}</View>;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flex: 0.2,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
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
