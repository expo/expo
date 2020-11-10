import 'react-native-url-polyfill/auto';

import { BarCodeScanner } from 'expo-barcode-scanner';
import React from 'react';
import {
  Text,
  View,
  NativeModules,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TextInput,
  Platform,
  TouchableOpacity,
} from 'react-native';

const DevelopmentClient = NativeModules.EXDevelopmentClient;

const getReactNativeBundleURL = (baseURL: URL) => {
  if (baseURL.pathname !== '/') {
    return baseURL;
  }

  return new URL(`index.bundle?platform=${Platform.OS}&dev=true&minify=false`, baseURL);
};

// Use development client native module to load app at given URL, notifying of
// errors

const loadAppFromUrl = async (urlString: string, setLoading: (boolean) => void) => {
  if (Platform.OS === 'ios') {
    try {
      setLoading(true);
      await DevelopmentClient.loadApp(urlString);
    } catch (e) {
      setLoading(false);
      Alert.alert('Error loading app', e.toString());
    }
  } else {
    try {
      urlString = urlString.trim().replace(/^exp:\/\//, 'http://');

      setLoading(true);
      const url = new URL(urlString);
      const headResponse = await fetch(url.toString(), { method: 'HEAD' });
      if (headResponse.headers.get('Exponent-Server')) {
        // It's an Expo manifest
        const getResponse = await fetch(url.toString(), { method: 'GET' });
        const manifest = JSON.parse(await getResponse.text());
        await DevelopmentClient.loadApp(manifest.bundleUrl, {
          orientation: manifest.orientation || 'default',
        });
      } else {
        // It's (maybe) a raw React Native bundle
        await DevelopmentClient.loadApp(getReactNativeBundleURL(url).toString(), {});
      }
    } catch (e) {
      setLoading(false);
      Alert.alert('Error loading app', e.toString());
    }
  }
};

//
// Reusable button for below code
//

const Button = ({ label, onPress }) => (
  <TouchableOpacity style={styles.buttonContainer} onPress={onPress}>
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);

//
// Super barebones UI supporting at least loading an app from a QR
// code, while we figure out what the design for this screen should be / decide
// on features to support
//

const App = () => {
  const [scanning, setScanning] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [textInputUrl, setTextInputUrl] = React.useState('');

  const onBarCodeScanned = ({ data }: { data: string }) => {
    loadAppFromUrl(data, setLoading);
  };

  const onPressScan = () => {
    setScanning(true);
  };

  const onPressCancelScan = () => {
    setScanning(false);
  };

  const onPressGoToUrl = () => {
    loadAppFromUrl(textInputUrl, setLoading);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : scanning ? (
          <React.Fragment>
            <View style={styles.barCodeScannerContainer}>
              <BarCodeScanner onBarCodeScanned={onBarCodeScanned} style={styles.barCodeScanner} />
            </View>
            <Button onPress={onPressCancelScan} label="Cancel" />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Text style={styles.headingText}>Connect to a development server</Text>

            <Text style={styles.infoText}>Start a local server with:</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>
                EXPO_USE_DEV_SERVER=true EXPO_TARGET=bare expo start
              </Text>
            </View>

            <Text style={styles.connectText}>Connect this client</Text>
            <Button onPress={onPressScan} label="Scan QR code" />

            <Text style={[styles.infoText, { marginTop: 12 }]}>
              Or, enter the URL of a local bundler manually:
            </Text>
            <TextInput
              style={styles.urlTextInput}
              placeholder="exp://192..."
              placeholderTextColor="#b0b0ba"
              value={textInputUrl}
              onChangeText={text => setTextInputUrl(text)}
            />
            <Button onPress={onPressGoToUrl} label="Connect to URL" />
          </React.Fragment>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 24,
  },

  barCodeScannerContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  barCodeScanner: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 24,
  },

  buttonContainer: {
    backgroundColor: '#4630eb',
    borderRadius: 4,
    padding: 12,
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },

  headingText: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
  },

  codeBox: {
    backgroundColor: '#f5f5f7',
    borderWidth: 1,
    borderColor: '#dddde1',
    padding: 14,
    borderRadius: 4,
    marginBottom: 20,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },

  connectText: {
    fontSize: 16,
    fontWeight: '600',
  },

  urlTextInput: {
    width: '100%',

    fontSize: 16,
    padding: 8,

    borderWidth: 1,
    borderColor: '#dddde1',
    borderRadius: 4,
  },
});

export default App;
