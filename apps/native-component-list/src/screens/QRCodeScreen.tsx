import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import * as BarCodeScanner from 'expo-barcode-scanner';
import { BlurView } from 'expo-blur';
import { Camera, CameraType, FlashMode } from 'expo-camera/legacy';
import * as Haptics from 'expo-haptics';
import * as React from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Path, Svg, SvgProps } from 'react-native-svg';

import Colors from '../constants/Colors';
import usePermissions from '../utilities/usePermissions';

function useCameraTypes(): CameraType[] | null {
  const [types, setTypes] = React.useState<CameraType[] | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    if (Platform.OS !== 'web') {
      setTypes([CameraType.front, CameraType.back]);
    } else {
      // TODO: This method isn't supported on native
      Camera.getAvailableCameraTypesAsync().then((types) => {
        if (isMounted) {
          setTypes(types as CameraType[]);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, []);
  return types;
}

function useToggleCameraType(preferredInitialType: CameraType): {
  // The current camera type, null when loading types.
  type: CameraType | null;
  // Available camera types, null when loading types.
  types: CameraType[] | null;
  // Toggle the current camera type to the next available camera type, null when toggling isn't possible (1 or less cameras on the device).
  toggle: null | (() => CameraType);
} {
  const [type, setType] = React.useState<CameraType | null>(null);
  const types = useCameraTypes();

  React.useEffect(() => {
    if (!types) return;
    if (types.includes(preferredInitialType)) {
      setType(preferredInitialType);
    } else {
      setType(types[0]);
    }
  }, [types]);

  const toggle =
    types && types.length > 1
      ? () => {
          const selectedIndex = types.findIndex((c) => c === type);
          const nextIndex = (selectedIndex + 1) % types.length;
          setType(types[nextIndex]);
          return types[nextIndex];
        }
      : null;

  return { type, toggle, types };
}

function useCameraAvailable(): boolean {
  const [isAvailable, setAvailable] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    if (Platform.OS !== 'web') {
      setAvailable(true);
    } else {
      // TODO: This method isn't supported on native
      Camera.isAvailableAsync().then((isAvailable) => {
        if (isMounted) {
          setAvailable(isAvailable);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, []);
  return isAvailable;
}

export default function QRCodeScreen() {
  const [isPermissionsGranted] = usePermissions(Camera.requestCameraPermissionsAsync);
  const isAvailable = useCameraAvailable();

  if (!isPermissionsGranted || !isAvailable) {
    // this can also occur if the device doesn't have a camera
    const message = isAvailable
      ? 'You have not granted permission to use the camera on this device!'
      : 'Your device does not have a camera';
    return (
      <View style={styles.container}>
        <Text>{message}</Text>
      </View>
    );
  }

  return <QRCodeView />;
}

QRCodeScreen.navigationOptions = {
  title: 'QR Code',
};

function QRCodeView() {
  const [data, setData] = React.useState<string | null>(null);
  const [isLit, setLit] = React.useState(false);
  const [zoom, setZoom] = React.useState(0);
  const { type, toggle } = useToggleCameraType(CameraType.back);

  const onFlashToggle = React.useCallback(() => {
    setLit((isLit) => !isLit);
  }, []);

  // hide footer when no actions are possible -- i.e. desktop web
  const showFooter = !!toggle || type === CameraType.back;

  // TODO(Bacon): We need a way to determine if the current camera supports certain capabilities (like zooming).
  const supportsZoom = true;

  return (
    <View style={styles.container}>
      {type && (
        <OverlayView
          style={StyleSheet.absoluteFill}
          renderOverlay={() => (
            <View
              style={{
                position: 'absolute',
                bottom: 8,
                left: 24,
                right: 24,
                alignItems: 'center',
              }}>
              <Slider
                disabled={!supportsZoom}
                minimumTrackTintColor={Colors.tintColor}
                thumbTintColor={Colors.tintColor}
                value={zoom}
                onValueChange={setZoom}
                style={{ flex: 1, maxWidth: 560, width: '95%' }}
              />
            </View>
          )}>
          <Camera
            type={type}
            zoom={zoom}
            barCodeScannerSettings={{
              interval: 1000,
              barCodeTypes: [
                BarCodeScanner.Constants.BarCodeType.qr,
                BarCodeScanner.Constants.BarCodeType.pdf417,
              ],
            }}
            onBarCodeScanned={(incoming) => {
              if (data !== incoming.data) {
                console.log('found: ', incoming);
                setData(incoming.data);
              }
            }}
            style={{ flex: 1 }}
            flashMode={isLit ? FlashMode.torch : FlashMode.off}
          />
        </OverlayView>
      )}

      <View pointerEvents="none" style={[styles.header, { top: 40 }]}>
        {data && <Hint>{data}</Hint>}
      </View>

      <QRIndicator />

      {showFooter && (
        <View pointerEvents="box-none" style={[styles.footer, { bottom: 30 }]}>
          <QRFooterButton disabled={!toggle} onPress={toggle} iconName="camera-reverse" />
          <QRFooterButton
            disabled={type !== CameraType.back}
            onPress={onFlashToggle}
            isActive={isLit}
            iconName="flashlight"
          />
        </View>
      )}
    </View>
  );
}

function OverlayView({
  style,
  renderOverlay,
  ...props
}: React.ComponentProps<typeof View> & {
  renderOverlay: () => React.ReactNode;
  children?: React.ReactNode;
}) {
  const [isOverlayActive, setOverlayActive] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setInterval>>();
  const opacity = React.useRef(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(opacity.current, {
      toValue: isOverlayActive ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isOverlayActive]);

  const onPress = () => {
    clearTimeout(timer.current);
    setOverlayActive(true);
    timer.current = setTimeout(() => {
      setOverlayActive(() => false);
    }, 5000);
  };

  return (
    <Pressable style={style} onPress={onPress}>
      {props.children}
      <Animated.View
        pointerEvents={isOverlayActive ? 'box-none' : 'none'}
        style={[StyleSheet.absoluteFill, { opacity: opacity.current }]}>
        {renderOverlay()}
      </Animated.View>
    </Pressable>
  );
}

function Hint({ children }: { children: string }) {
  return (
    <BlurView style={styles.hint} intensity={100} tint="dark">
      <Text style={styles.headerText}>{children}</Text>
    </BlurView>
  );
}

function QRIndicator() {
  const scale = React.useMemo(() => new Animated.Value(1), []);
  const duration = 500;
  React.useEffect(() => {
    let mounted = true;

    function cycleAnimation() {
      Animated.sequence([
        Animated.timing(scale, {
          easing: Easing.in(Easing.quad),
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          easing: Easing.out(Easing.quad),
          toValue: 1.05,
          duration,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (mounted) {
          cycleAnimation();
        }
      });
    }
    cycleAnimation();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AnimatedScanner
      pointerEvents="none"
      style={[
        // shadow is only properly supported on iOS
        Platform.OS === 'ios' && styles.scanner,
        {
          transform: [{ scale }],
        },
      ]}
    />
  );
}

function SvgComponent({ ...props }: SvgProps) {
  if (Platform.OS === 'web') {
    delete props.collapsable;
  }

  return (
    <Svg width={258} height={258} viewBox="0 0 258 258" fill="none" {...props}>
      <Path
        d="M211 250a4 4 0 000 8v-8zm47-39a4 4 0 00-8 0h8zm-11.5 34l-2.948-2.703L246.5 245zM211 258c6.82 0 14.15-.191 20.795-1.495 6.629-1.3 13.067-3.799 17.653-8.802l-5.896-5.406c-2.944 3.21-7.457 5.212-13.297 6.358C224.433 249.798 217.777 250 211 250v8zm38.448-10.297c4.209-4.59 6.258-10.961 7.322-17.287 1.076-6.395 1.23-13.307 1.23-19.416h-8c0 6.056-.162 12.398-1.119 18.089-.969 5.759-2.669 10.306-5.329 13.208l5.896 5.406zM250 47a4 4 0 008 0h-8zM211 0a4 4 0 000 8V0zm34 11.5l-2.703 2.948L245 11.5zM258 47c0-6.82-.191-14.15-1.495-20.795-1.3-6.629-3.799-13.067-8.802-17.653l-5.406 5.896c3.21 2.944 5.212 7.457 6.358 13.297C249.798 33.568 250 40.223 250 47h8zM247.703 8.552c-4.59-4.209-10.961-6.258-17.287-7.322C224.021.154 217.109 0 211 0v8c6.056 0 12.398.162 18.089 1.119 5.759.969 10.306 2.67 13.208 5.33l5.406-5.897zM8 211a4 4 0 00-8 0h8zm39 47a4 4 0 000-8v8zm-34-11.5l2.703-2.948L13 246.5zM0 211c0 6.82.19 14.15 1.495 20.795 1.3 6.629 3.799 13.067 8.802 17.653l5.406-5.896c-3.21-2.944-5.212-7.457-6.358-13.297C8.202 224.433 8 217.777 8 211H0zm10.297 38.448c4.59 4.209 10.961 6.258 17.287 7.322C33.98 257.846 40.892 258 47 258v-8c-6.056 0-12.398-.162-18.088-1.119-5.76-.969-10.307-2.669-13.209-5.329l-5.406 5.896zM47 8a4 4 0 000-8v8zM0 47a4 4 0 008 0H0zm11.5-34l2.948 2.703L11.5 13zM47 0c-6.82 0-14.15.19-20.795 1.495-6.629 1.3-13.067 3.799-17.653 8.802l5.896 5.406c2.944-3.21 7.457-5.212 13.297-6.358C33.568 8.202 40.223 8 47 8V0zM8.552 10.297c-4.209 4.59-6.258 10.961-7.322 17.287C.154 33.98 0 40.892 0 47h8c0-6.056.162-12.398 1.119-18.088.969-5.76 2.67-10.307 5.33-13.209l-5.897-5.406z"
        fill="#fff"
      />
    </Svg>
  );
}

const AnimatedScanner = Animated.createAnimatedComponent(SvgComponent);

// note(bacon): Purposefully skip using the themed icons since we want the icons to change color based on toggle state.
const shouldUseHaptics = Platform.OS === 'ios';

const size = 64;
const slop = 40;

const hitSlop = { top: slop, bottom: slop, right: slop, left: slop };

function QRFooterButton({
  onPress,
  isActive = false,
  iconName,
  iconSize = 36,
  style,
  disabled,
}: {
  style?: StyleProp<ViewStyle>;
  onPress?: (() => void) | null;
  isActive?: boolean;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconSize?: number;
  disabled?: boolean;
}) {
  const tint = isActive ? 'default' : 'dark';
  const iconColor = isActive ? Colors.tintColor : '#ffffff';

  const onPressIn = React.useCallback(() => {
    if (shouldUseHaptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const onPressButton = React.useCallback(() => {
    onPress?.();
    if (shouldUseHaptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [onPress]);

  return (
    <TouchableOpacity
      style={[style, { opacity: disabled ? 0.5 : 1.0 }]}
      disabled={disabled || !onPress}
      hitSlop={hitSlop}
      onPressIn={onPressIn}
      onPress={onPressButton}>
      <BlurView intensity={100} style={styles.buttonContainer} tint={tint}>
        <Ionicons name={iconName} size={iconSize} color={iconColor} />
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanner: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    backgroundColor: 'transparent',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '10%',
  },
});
