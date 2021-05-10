import React, { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Modal,
  TouchableHighlight,
  Button,
  Image,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [visible, setVisible] = useState(false);
  const [failedCount, setFailedCount] = useState(0);

  const setModalVisible = visible => {
    setVisible(visible);
  };

  const clearState = () => {
    setAuthenticated(false);
    setFailedCount(0);
  };

  const scanFingerPrint = async () => {
    try {
      let results = await LocalAuthentication.authenticateAsync();
      if (results.success) {
        setVisible(false);
        setAuthenticated(true);
        setFailedCount(0);
      } else {
        setFailedCount(failedCount => failedCount + 1);
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View
      style={[
        styles.container,
        visible ? { backgroundColor: '#b7b7b7' } : { backgroundColor: 'white' },
      ]}>
      <Button
        title={authenticated ? 'Reset and begin Authentication again' : 'Begin Authentication'}
        onPress={() => {
          clearState();
          if (Platform.OS === 'android') {
            setVisible(!visible);
          } else {
            scanFingerPrint();
          }
        }}
      />

      {authenticated && <Text style={styles.text}>Authentication Successful! 🎉</Text>}

      <Modal animationType="slide" transparent={true} visible={visible} onShow={scanFingerPrint}>
        <View style={styles.modal}>
          <View style={styles.innerContainer}>
            <Text>Sign in with fingerprint</Text>
            <Image
              style={{ width: 128, height: 128 }}
              source={require('./assets/fingerprint.png')}
            />
            {failedCount > 0 && (
              <Text style={{ color: 'red', fontSize: 14 }}>
                Failed to authenticate, press cancel and try again.
              </Text>
            )}
            <TouchableHighlight
              onPress={async () => {
                LocalAuthentication.cancelAuthenticate();
                setModalVisible(!visible);
              }}>
              <Text style={{ color: 'red', fontSize: 16 }}>Cancel</Text>
            </TouchableHighlight>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignContent: 'center',
    paddingTop: Constants.statusBarHeight,
    padding: 8,
  },
  modal: {
    flex: 1,
    marginTop: '90%',
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    marginTop: '30%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    alignSelf: 'center',
    fontSize: 22,
    paddingTop: 20,
  },
});
