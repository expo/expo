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
  TextInput,
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
  const [textInputUrl, setTextInputUrl] = React.useState('');

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

  const onPressGoToUrl = () => {
    loadAppFromUrl(textInputUrl);
    setLoading(true);
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
            <View style={styles.urlTextInputContainer}>
              <TextInput
                style={styles.urlTextInput}
                placeholder="Paste a URL"
                value={textInputUrl}
                onChangeText={text => setTextInputUrl(text)}
              />
            </View>
            <View style={styles.buttonContainer}>
              <Button onPress={onPressGoToUrl} title="Go to URL" />
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
  },

  headingText: {
    fontSize: 32,
    marginBottom: 12,
  },

  urlTextInputContainer: {
    marginTop: 24,
  },
  urlTextInput: {
    width: '100%',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 6,
    fontSize: 18,
    padding: 8,
  },
});

export default App;
