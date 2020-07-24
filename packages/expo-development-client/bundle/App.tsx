import React from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  NativeModules,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { BarCodeScanner } from './BarCodeScanner';

const DevelopmentClient = NativeModules.EXDevelopmentClient;

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

const App = () => {
  const [scanning, setScanning] = React.useState(false);

  const onBarCodeScanned = ({ data }: { data: string }) => {
    loadAppFromUrl(data);
  };

  const onPressScan = () => {
    setScanning(true);
  };

  const onPressCancelScan = () => {
    setScanning(false);
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#F5FCFF',
      }}>
      <StatusBar barStyle="dark-content" />
      <View
        style={{
          flex: 1,
          paddingTop: 24,
          paddingHorizontal: 24,
        }}>
        {scanning ? (
          <React.Fragment>
            <View
              style={{
                width: '100%',
                aspectRatio: 1,
                borderRadius: 8,
                overflow: 'hidden',
              }}>
              <BarCodeScanner onBarCodeScanned={onBarCodeScanned} style={{ flex: 1 }} />
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: '#eee',
                marginTop: 20,
                padding: 12,
                borderRadius: 6,
              }}>
              <Text style={{ fontSize: 20 }} onPress={onPressCancelScan}>
                Cancel
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Text style={{ fontSize: 32 }} onPress={onPressScan}>
              Expo Development Client
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#eee',
                marginTop: 20,
                padding: 12,
                borderRadius: 6,
              }}>
              <Text style={{ fontSize: 20 }} onPress={onPressScan}>
                Scan QR code
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        )}
      </View>
    </SafeAreaView>
  );
};

export default App;
