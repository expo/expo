import { StackScreenProps } from '@react-navigation/stack';
import { BlurView } from 'expo-blur';
import { throttle } from 'lodash';
import React from 'react';
import { Linking, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CameraView from '../components/Camera';
import QRFooterButton from '../components/QRFooterButton';
import QRIndicator from '../components/QRIndicator';
import { ModalStackRoutes } from '../navigation/Navigation.types';

type State = {
  isVisible: boolean;
  url: null | string;
};

const initialState: State = { isVisible: Platform.OS === 'ios', url: null };

export default function BarCodeScreen(props: StackScreenProps<ModalStackRoutes, 'QRCode'>) {
  const [state, setState] = React.useReducer(
    (props: State, state: Partial<State>): State => ({ ...props, ...state }),
    initialState
  );
  const [isLit, setLit] = React.useState(false);

  React.useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (!state.isVisible) {
      timeout = setTimeout(() => {
        setState({ isVisible: true });
      }, 800);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  React.useEffect(() => {
    if (!state.isVisible && state.url) {
      openUrl(state.url);
    }
  }, [state.isVisible, state.url]);

  const _handleBarCodeScanned = throttle(({ data: url }) => {
    setState({ isVisible: false, url });
  }, 1000);

  const openUrl = (url: string) => {
    props.navigation.pop();

    setTimeout(
      () => {
        // note(brentvatne): Manually reset the status bar before opening the
        // experience so that we restore the correct status bar color when
        // returning to home
        StatusBar.setBarStyle('default');
        Linking.openURL(url);
      },
      Platform.select({
        ios: 16,
        // note(brentvatne): Give the modal a bit of time to dismiss on Android
        default: 500,
      })
    );
  };

  const onCancel = React.useCallback(() => {
    if (Platform.OS === 'ios') {
      props.navigation.pop();
    } else {
      props.navigation.goBack();
    }
  }, []);

  const onFlashToggle = React.useCallback(() => {
    setLit((isLit) => !isLit);
  }, []);

  const { top, bottom } = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {state.isVisible ? (
        <CameraView
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={_handleBarCodeScanned}
          style={StyleSheet.absoluteFill}
          enableTorch={isLit}
        />
      ) : null}

      <View style={[styles.header, { top: 40 + top }]}>
        <Hint>Scan an Expo QR code</Hint>
      </View>

      <QRIndicator />

      <View style={[styles.footer, { bottom: 30 + bottom }]}>
        <QRFooterButton onPress={onFlashToggle} isActive={isLit} iconName="flashlight" />
        <QRFooterButton onPress={onCancel} iconName="close" iconSize={48} />
      </View>

      <StatusBar barStyle="light-content" backgroundColor="#000" />
    </View>
  );
}

function Hint({ children }: { children: string }) {
  return (
    <BlurView style={styles.hint} intensity={100} tint="dark">
      <Text style={styles.headerText}>{children}</Text>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 16,
    overflow: 'hidden',
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
