import Ionicons from '@expo/vector-icons/build/Ionicons';
import { BlurView } from 'expo-blur';
import { Camera } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { throttle } from 'lodash';
import React from 'react';
import {
  Animated,
  Easing,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import TouchableBounce from 'react-native/Libraries/Components/Touchable/TouchableBounce';

import Colors from '../constants/Colors';
import isIPhoneX from '../utils/isIPhoneX';

export default class BarCodeScreen extends React.Component {
  static navigationOptions = {
    headerShown: false,
  };

  state = {
    isLit: false,
    scannerIsVisible: Platform.select({
      ios: true,
      android: false,
    }),
  };

  _hasOpenedUrl = false;
  _isMounted = false;

  componentDidMount() {
    this._isMounted = true;
    setTimeout(() => {
      this.setState({ scannerIsVisible: true });
    }, 800);
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    return (
      <View style={styles.container}>
        {this.state.scannerIsVisible ? (
          <Camera
            onBarCodeScanned={this._handleBarCodeScanned}
            style={StyleSheet.absoluteFill}
            flashMode={this.state.isLit ? 'torch' : 'off'}
          />
        ) : null}

        <View style={styles.header}>
          <BlurView
            intensity={100}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 20,
              borderRadius: 16,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            tint="dark">
            <Text style={styles.headerText}>Scan an Expo QR code</Text>
          </BlurView>
        </View>

        <PulsingComponent />

        <View style={styles.footer}>
          <FooterButton
            onPress={() => {
              this.setState(({ isLit }) => ({ isLit: !isLit }));
            }}
            isActive={this.state.isLit}
            iconName="ios-flashlight"
          />
          <FooterButton
            iconSize={48}
            onPress={this._handlePressCancel}
            isActive={false}
            iconName="ios-close"
          />
        </View>

        <StatusBar barStyle="light-content" backgroundColor="#000" />
      </View>
    );
  }

  private _handleBarCodeScanned = throttle(({ data: url }) => {
    this.setState({ scannerIsVisible: false }, () => {
      if (this._isMounted) {
        this._openUrl(url);
      }
    });
  }, 1000);

  _openUrl = (url: string) => {
    this.props.navigation.pop();

    setTimeout(
      () => {
        // note(brentvatne): Manually reset the status bar before opening the
        // experience so that we restore the correct status bar color when
        // returning to home
        StatusBar.setBarStyle('default');

        if (!this._hasOpenedUrl) {
          this._hasOpenedUrl = true;
          Linking.openURL(url);
        }
      },
      Platform.select({
        ios: 16,
        // note(brentvatne): Give the modal a bit of time to dismiss on Android
        default: 500,
      })
    );
  };

  _handlePressCancel = () => {
    if (Platform.OS === 'ios') {
      this.props.navigation.pop();
    } else {
      this.props.navigation.goBack(null);
    }
  };
}

function PulsingComponent() {
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
      style={{
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,

        transform: [{ scale }],
      }}
    />
  );
}

class SvgComponent extends React.Component<React.SVGProps<SVGSVGElement>> {
  render() {
    return (
      <Svg width={258} height={258} viewBox="0 0 258 258" fill="none" {...this.props}>
        <Path
          d="M211 250a4 4 0 000 8v-8zm47-39a4 4 0 00-8 0h8zm-11.5 34l-2.948-2.703L246.5 245zM211 258c6.82 0 14.15-.191 20.795-1.495 6.629-1.3 13.067-3.799 17.653-8.802l-5.896-5.406c-2.944 3.21-7.457 5.212-13.297 6.358C224.433 249.798 217.777 250 211 250v8zm38.448-10.297c4.209-4.59 6.258-10.961 7.322-17.287 1.076-6.395 1.23-13.307 1.23-19.416h-8c0 6.056-.162 12.398-1.119 18.089-.969 5.759-2.669 10.306-5.329 13.208l5.896 5.406zM250 47a4 4 0 008 0h-8zM211 0a4 4 0 000 8V0zm34 11.5l-2.703 2.948L245 11.5zM258 47c0-6.82-.191-14.15-1.495-20.795-1.3-6.629-3.799-13.067-8.802-17.653l-5.406 5.896c3.21 2.944 5.212 7.457 6.358 13.297C249.798 33.568 250 40.223 250 47h8zM247.703 8.552c-4.59-4.209-10.961-6.258-17.287-7.322C224.021.154 217.109 0 211 0v8c6.056 0 12.398.162 18.089 1.119 5.759.969 10.306 2.67 13.208 5.33l5.406-5.897zM8 211a4 4 0 00-8 0h8zm39 47a4 4 0 000-8v8zm-34-11.5l2.703-2.948L13 246.5zM0 211c0 6.82.19 14.15 1.495 20.795 1.3 6.629 3.799 13.067 8.802 17.653l5.406-5.896c-3.21-2.944-5.212-7.457-6.358-13.297C8.202 224.433 8 217.777 8 211H0zm10.297 38.448c4.59 4.209 10.961 6.258 17.287 7.322C33.98 257.846 40.892 258 47 258v-8c-6.056 0-12.398-.162-18.088-1.119-5.76-.969-10.307-2.669-13.209-5.329l-5.406 5.896zM47 8a4 4 0 000-8v8zM0 47a4 4 0 008 0H0zm11.5-34l2.948 2.703L11.5 13zM47 0c-6.82 0-14.15.19-20.795 1.495-6.629 1.3-13.067 3.799-17.653 8.802l5.896 5.406c2.944-3.21 7.457-5.212 13.297-6.358C33.568 8.202 40.223 8 47 8V0zM8.552 10.297c-4.209 4.59-6.258 10.961-7.322 17.287C.154 33.98 0 40.892 0 47h8c0-6.056.162-12.398 1.119-18.088.969-5.76 2.67-10.307 5.33-13.209l-5.897-5.406z"
          fill="#fff"
        />
      </Svg>
    );
  }
}

const AnimatedScanner = Animated.createAnimatedComponent(SvgComponent);

const shouldUseHaptics = Platform.OS === 'ios';

function FooterButton({
  onPress,
  isActive,
  iconName,
  iconSize = 36,
}: {
  onPress: () => void;
  isActive: boolean;
  iconName: string;
  iconSize?: number;
}) {
  const tint = isActive ? 'default' : 'dark';
  const size = 64;
  const slop = 40;
  const iconColor = isActive ? Colors.light.tintColor : '#ffffff';
  return (
    <TouchableBounce
      hitSlop={{ top: slop, bottom: slop, right: slop, left: slop }}
      onPressIn={() => {
        if (shouldUseHaptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }}
      onPress={() => {
        onPress();
        if (shouldUseHaptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }}>
      <BlurView
        intensity={100}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        tint={tint}>
        <Ionicons name={iconName} size={iconSize} color={iconColor} />
      </BlurView>
    </TouchableBounce>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: isIPhoneX ? 80 : 40,
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
    bottom: isIPhoneX ? 80 : 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '10%',
  },
  cancelText: {
    color: '#fff',
    backgroundColor: 'transparent',
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
  },
});
