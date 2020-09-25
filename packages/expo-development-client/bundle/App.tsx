import React from 'react';
import {
  Text,
  View,
  NativeModules,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Button,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

const DevelopmentClient = NativeModules.EXDevelopmentClient;

// Use development client native module to load app at given URL, notifying of
// errors

const loadAppFromUrl = async (url: string) => {
  url = url.replace(/^exp:\/\//, 'http://');
  try {
    const headResponse = await fetch(url, { method: 'HEAD' });
    if (headResponse.headers.get('Exponent-Server')) {
      // It's an Expo manifest
      const getResponse = await fetch(url, { method: 'GET' });
      const manifest = JSON.parse(await getResponse.text());
      await DevelopmentClient.loadApp(manifest.bundleUrl, {
        orientation: manifest.orientation || 'default',
      });
    } else {
      // It's (maybe) a raw React Native bundle
      await DevelopmentClient.loadApp(url, {});
    }
  } catch (e) {
    Alert.alert('Error loading app', e.toString());
  }
};

//
// Super barebones UI supporting at least loading an app from a QR
// code, while we figure out what the design for this screen should be / decide
// on features to support
//

const App = () => {
  const [scanning, setScanning] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const onBarCodeScanned = ({ data }: { data: string }) => {
    loadAppFromUrl(data);
    setLoading(true);
  };

  const onPressScan = () => {
    setScanning(true);
  };

  const onPressCancelScan = () => {
    setScanning(false);
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
            <View style={styles.buttonContainer}>
              <Button onPress={onPressCancelScan} title="Cancel" />
            </View>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Text style={styles.headingText} onPress={onPressScan}>
              Expo Development Client
            </Text>
            <View style={styles.buttonContainer}>
              <Button onPress={onPressScan} title="Scan QR code" />
            </View>
          </React.Fragment>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5FCFF',
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
    alignSelf: 'flex-start',
    marginTop: 8,
    fontSize: 24,
  },

  headingText: {
    fontSize: 32,
  },
});

export default App;
