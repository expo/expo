import 'react-native-url-polyfill/auto';

import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  NativeModules,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TextInput,
  Platform,
  TouchableOpacity,
  NativeEventEmitter,
} from 'react-native';

import ListItem from './ListItem';
const DevLauncher = NativeModules.EXDevLauncher;

// Use development client native module to load app at given URL, notifying of
// errors

const loadAppFromUrl = async (urlString: string, setLoading: (boolean) => void) => {
  try {
    setLoading(true);
    await DevLauncher.loadApp(urlString);
  } catch (e) {
    setLoading(false);
    Alert.alert('Error loading app', e.toString());
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

const ON_NEW_DEEP_LINK_EVENT = 'expo.modules.devlauncher.onnewdeeplink';

const App = () => {
  const [loading, setLoading] = useState(false);
  const [textInputUrl, setTextInputUrl] = useState('');
  const [recentlyOpenedApps, setRecentlyOpenedApps] = useState({});
  const [pendingDeepLink, setPendingDeepLink] = useState<string | null>(null);

  useEffect(() => {
    const getPendingDeepLink = async () => {
      setPendingDeepLink(await DevLauncher.getPendingDeepLink());
    };

    const getRecentlyOpenedApps = async () => {
      setRecentlyOpenedApps(await DevLauncher.getRecentlyOpenedApps());
    };

    const onNewDeepLinkListener = new NativeEventEmitter(DevLauncher).addListener(
      ON_NEW_DEEP_LINK_EVENT,
      (deepLink: string) => {
        setPendingDeepLink(deepLink);
      }
    );

    getRecentlyOpenedApps();
    getPendingDeepLink();

    return () => {
      onNewDeepLinkListener.remove();
    };
  }, []);

  const onPressScanIOS = () => {
    Alert.alert('Please, go to the your camera app and scan the QR code.');
  };

  const onPressScanAndroid = async () => {
    try {
      await DevLauncher.openCamera();
    } catch (e) {
      Alert.alert(
        "Couldn't open the camera app. Please, open the system camera and scan the QR code.",
        e.toString()
      );
    }
  };

  const onPressGoToUrl = () => {
    loadAppFromUrl(textInputUrl, setLoading);
  };

  const recentlyProjects = Object.entries(recentlyOpenedApps).map(([url, name]) => {
    const title = (name ?? url) as string;
    return <ListItem key={url} title={title} onPress={() => loadAppFromUrl(url, setLoading)} />;
  });

  if (loading) {
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container}>
        <>
          {pendingDeepLink && (
            <View style={styles.pendingDeepLinkContainer}>
              <View style={styles.pendingDeepLinkTextBox}>
                <Text style={styles.pendingDeepLinkInfo}>
                  The application received a deep link. However, the development client couldn't
                  decide where it should be dispatched. The next loaded project will handle the
                  received deep link.
                </Text>
                <Text style={styles.pendingDeepLink}> {pendingDeepLink}</Text>
              </View>
            </View>
          )}
          <View style={styles.homeContainer}>
            <Text style={styles.headingText}>Connect to a development server</Text>
            <Text style={styles.infoText}>Start a local server with:</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>
                EXPO_USE_DEV_SERVER=true EXPO_TARGET=bare expo start
              </Text>
            </View>

            <Text style={styles.connectText}>Connect this client</Text>
            <Button
              onPress={Platform.select({ ios: onPressScanIOS, android: onPressScanAndroid })}
              label="Scan QR code"
            />

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
            {recentlyProjects.length > 0 && (
              <>
                <Text style={[styles.infoText, { marginTop: 12 }]}>Recently opened projects:</Text>
                {recentlyProjects}
              </>
            )}
          </View>
        </>
      </ScrollView>
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
  },

  homeContainer: {
    paddingTop: 24,
    paddingHorizontal: 24,
  },

  barCodeScannerContainer: {
    paddingTop: 24,
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 24,
  },
  barCodeScanner: {
    flex: 1,
  },

  pendingDeepLinkContainer: {
    paddingHorizontal: -24,
    backgroundColor: '#4630eb',
  },
  pendingDeepLinkTextBox: {
    padding: 10,
  },
  pendingDeepLinkInfo: {
    color: '#f5f5f7',
  },
  pendingDeepLink: {
    marginTop: 10,
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
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
    paddingTop: 24,
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
