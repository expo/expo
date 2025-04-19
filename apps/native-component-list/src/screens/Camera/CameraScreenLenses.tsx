import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import { Camera, CameraMode, CameraType, CameraView, PermissionStatus } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('screen');

interface State {
  facing: CameraType;
  permissionsGranted: boolean;
  permission?: PermissionStatus;
  showMoreOptions: boolean;
  lensId: number;
  mode: CameraMode;
  zoom?: number;
  selectedLens?: string;
}

export default function CameraScreenLenses() {
  const camera = useRef<CameraView>(null);
  const [availableLenses, setAvailableLenses] = useState<string[]>([]);

  const [state, setState] = useState<State>({
    permission: undefined,
    facing: 'back',
    permissionsGranted: false,
    showMoreOptions: false,
    mode: 'picture',
    lensId: 0,
  });

  const toggleFacing = async () => {
    setState((state) => ({
      ...state,
      selectedLens: '',
      facing: state.facing === 'back' ? 'front' : 'back',
    }));
  };

  const toggleMoreOptions = () =>
    setState((state) => ({ ...state, showMoreOptions: !state.showMoreOptions }));

  const changeMode = () => {
    setState((state) => ({ ...state, mode: state.mode === 'picture' ? 'video' : 'picture' }));
  };

  const previousLens = () => changeLens(1);
  const nextLens = () => changeLens(-1);

  const changeLens = (direction: number) => {
    setState((state) => {
      let newId = state.lensId + direction;
      const length = availableLenses.length;
      if (newId >= length) {
        newId = 0;
      } else if (newId < 0) {
        newId = length - 1;
      }
      return {
        ...state,
        selectedLens: availableLenses[newId],
        lensId: newId,
      };
    });
  };

  const clearSelectedLens = () => {
    setState((state) => ({ ...state, selectedLens: '' }));
  };

  const takePicture = async () => {
    await camera?.current?.takePictureAsync({
      shutterSound: true,
    });
  };

  const fetchAvailableLenses = async () => {
    const lenses = await camera?.current?.getAvailableLensesAsync();
    setAvailableLenses(lenses ?? []);
  };

  const renderTopBar = () => (
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.toggleButton} onPress={toggleFacing}>
        <Ionicons name="camera-reverse" size={32} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toggleButton} onPress={fetchAvailableLenses}>
        <Text style={{ color: 'white' }}>Get Lenses</Text>
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
          <TouchableOpacity onPress={takePicture} style={{ alignSelf: 'center' }}>
            <Ionicons
              name="radio-button-on"
              size={64}
              color={state.mode === 'picture' ? 'white' : 'red'}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.bottomButton} onPress={clearSelectedLens}>
          <MaterialIcons name="clear" size={32} color="white" />
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
      <View style={styles.lensContainer}>
        <Text style={styles.lensNameLabel}>Selected Lens</Text>
        <View style={styles.lensChooser}>
          <TouchableOpacity onPress={previousLens} style={{ padding: 6 }}>
            <Ionicons name="arrow-back" size={14} color="white" />
          </TouchableOpacity>
          <View style={styles.lensLabel}>
            <Text style={{ color: 'white', flex: 1 }}>{state.selectedLens}</Text>
          </View>
          <TouchableOpacity onPress={nextLens} style={{ padding: 6 }}>
            <Ionicons name="arrow-forward" size={14} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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

  const renderCamera = () => (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <CameraView
          ref={camera}
          style={StyleSheet.absoluteFill}
          facing={state.facing}
          mode={state.mode}
          animateShutter
          selectedLens={state.selectedLens}
          videoQuality="1080p"
          zoom={state.zoom}
          onAvailableLensesChanged={({ lenses }) => {
            setAvailableLenses(lenses);
          }}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'pdf417'],
          }}
        />
        {renderTopBar()}
        {renderBottomBar()}
        {state.showMoreOptions && renderMoreOptions()}
      </View>
    </View>
  );

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setState((state) => ({
        ...state,
        permission: status,
        permissionsGranted: status === 'granted',
      }));
    });
  }, []);

  const cameraScreenContent = state.permissionsGranted ? renderCamera() : renderNoPermissions();
  return <View style={styles.container}>{cameraScreenContent}</View>;
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
  noPermissions: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f8fdff',
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
  lensContainer: {
    flex: 1,
    alignItems: 'center',
  },
  lensChooser: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  lensLabel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lensNameLabel: {
    fontSize: 10,
    marginVertical: 3,
    color: 'white',
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
  bottomButton: {
    flex: 0.3,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    paddingBottom: 12,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
