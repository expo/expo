import { Inter_900Black } from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

require('./includedAssets/test.png');
// eslint-disable-next-line no-unused-expressions
Inter_900Black;

function TestValue(props: { testID: string; value: string }) {
  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <Text style={styles.labelText}>{props.testID}</Text>
        <Text style={styles.labelText}>&nbsp;</Text>
        <Text style={styles.labelText} testID={props.testID}>
          {props.value || 'null'}
        </Text>
      </View>
    </View>
  );
}

function TestButton(props: { testID: string; onPress: () => void }) {
  return (
    <Pressable testID={props.testID} style={styles.button} onPress={props.onPress}>
      <Text style={styles.buttonText}>{props.testID}</Text>
    </Pressable>
  );
}

export default function App() {
  const [isReloading, setIsReloading] = React.useState(false);
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const [jsAPIDidThrowError, setJSAPIDidThrowError] = React.useState(false);

  const { currentlyRunning, availableUpdate } = Updates.useUpdates();

  React.useEffect(() => {
    setStartTime(Date.now());
  }, []);

  const handleCallJSAPI = async () => {
    try {
      await Updates.fetchUpdateAsync();
    } catch (e) {
      setJSAPIDidThrowError(true);
    }
  };

  const handleReload = async () => {
    setIsReloading(true);
    // this is done after a timeout so that the button press finishes for detox
    setTimeout(async () => {
      try {
        await Updates.reloadAsync();
        setIsReloading(false);
      } catch (e) {
        console.warn(e);
      }
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <TestValue testID="updateString" value="test" />
      <TestValue testID="updateID" value={`${Updates.updateId}`} />
      <TestValue testID="runtimeVersion" value={`${currentlyRunning.runtimeVersion}`} />
      <TestValue testID="checkAutomatically" value={`${Updates.checkAutomatically}`} />
      <TestValue testID="isEmbeddedLaunch" value={`${currentlyRunning.isEmbeddedLaunch}`} />
      <TestValue testID="launchDuration" value={`${currentlyRunning.launchDuration}`} />
      <TestValue testID="availableUpdateID" value={`${availableUpdate?.updateId}`} />
      <TestValue testID="isReloading" value={`${isReloading}`} />
      <TestValue testID="startTime" value={`${startTime}`} />

      <TestValue testID="lastJSAPIErrorMessage" value={`${jsAPIDidThrowError}`} />
      <View style={{ flexDirection: 'row' }}>
        <View>
          <TestButton testID="callJSAPI" onPress={handleCallJSAPI} />
          <TestButton testID="reload" onPress={handleReload} />
        </View>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 100,
    marginBottom: 100,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: '#4630EB',
  },
  buttonText: {
    color: 'white',
    fontSize: 6,
  },
  labelText: {
    fontSize: 6,
  },
  logEntriesContainer: {
    margin: 10,
    height: 50,
    paddingVertical: 5,
    paddingHorizontal: 10,
    width: '90%',
    minWidth: '90%',
    borderColor: '#4630EB',
    borderWidth: 1,
    borderRadius: 4,
  },
  logEntriesText: {
    fontSize: 6,
  },
});
