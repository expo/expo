import Ionicons from '@expo/vector-icons/build/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/build/MaterialCommunityIcons';
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
} from 'expo-camera/next';
import * as FileSystem from 'expo-file-system';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Svg from 'react-native-svg';

import GalleryScreen from './GalleryScreen';

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
  on: 'ios-volume-high',
  off: 'ios-volume-mute',
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
  barcodeData: string;
  newPhotos: boolean;
  permissionsGranted: boolean;
  permission?: PermissionStatus;
  showGallery: boolean;
  showMoreOptions: boolean;
  mode: CameraMode;
  recording: boolean;
}

export default class CameraScreen extends React.Component<object, State> {
  readonly state: State = {
    flash: 'off',
    zoom: 0,
    facing: 'back',
    barcodeScanning: false,
    torchEnabled: false,
    cornerPoints: undefined,
    mute: false,
    barcodeData: '',
    newPhotos: false,
    permissionsGranted: false,
    showGallery: false,
    showMoreOptions: false,
    mode: 'picture',
    recording: false,
  };

  camera?: CameraView;

  componentDidMount() {
    if (Platform.OS !== 'web') {
      this.ensureDirectoryExistsAsync();
    }
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      this.setState({ permission: status, permissionsGranted: status === 'granted' });
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

  toggleTorch = () => this.setState((state) => ({ torchEnabled: !state.torchEnabled }));

  toggleMute = () => this.setState((state) => ({ mute: !state.mute }));

  zoomOut = () => this.setState((state) => ({ zoom: state.zoom - 0.1 < 0 ? 0 : state.zoom - 0.1 }));

  zoomIn = () => this.setState((state) => ({ zoom: state.zoom + 0.1 > 1 ? 1 : state.zoom + 0.1 }));

  toggleBarcodeScanning = () =>
    this.setState((state) => ({ barcodeScanning: !state.barcodeScanning }));

  takePicture = async () => {
    if (this.camera) {
      await this.camera.takePictureAsync({ onPictureSaved: this.onPictureSaved });
    }
  };

  recordVideo = async () => {
    if (this.camera) {
      this.setState((state) => ({ recording: !state.recording }));
      if (this.state.recording) {
        this.camera.stopRecording();
        return Promise.resolve();
      } else {
        return await this.camera.recordAsync();
      }
    }
  };

  takeVideo = async () => {
    const result = await this.recordVideo();
    if (result?.uri) {
      await FileSystem.moveAsync({
        from: result.uri,
        to: `${FileSystem.documentDirectory}photos/${Date.now()}.${result.uri.split('.')[1]}`,
      });
    }
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
      <TouchableOpacity style={styles.toggleButton} onPress={this.toggleMoreOptions}>
        <MaterialCommunityIcons name="dots-horizontal" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );

  renderBottomBar = () => (
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
      <CameraView
        ref={(ref) => (this.camera = ref!)}
        style={styles.camera}
        onCameraReady={() => {
          console.log('ready');
        }}
        enableTorch={this.state.torchEnabled}
        facing={this.state.facing}
        flash={this.state.flash}
        mode={this.state.mode}
        mute={this.state.mute}
        zoom={this.state.zoom}
        videoQuality="2160p"
        onMountError={this.handleMountError}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'pdf417'],
        }}
        onBarcodeScanned={this.state.barcodeScanning ? this.onBarcodeScanned : undefined}>
        {this.renderTopBar()}
        {this.renderBottomBar()}
      </CameraView>
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
    width: 100,
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
