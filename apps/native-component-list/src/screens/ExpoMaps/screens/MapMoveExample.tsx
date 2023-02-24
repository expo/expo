import * as Maps from 'expo-maps';
import React, { useContext, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Platform,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { Snackbar } from 'react-native-paper';

import ProviderContext from '../context/ProviderContext';

export default function MapMoveExample() {
  const provider = useContext(ProviderContext);
  const ref = useRef<Maps.ExpoMap>(null);

  const [snackbarText, setSnackbarText] = useState<string | undefined>();
  const [animateCamera, setAnimateCamera] = useState<boolean>(true);
  const [animationDuration, setAnimationDuration] = useState<number>(1000);
  const [zoom, setZoom] = useState<number>(4);
  const [bearing, setBearing] = useState<number>(0);
  const [tilt, setTilt] = useState<number>(0);
  return (
    <KeyboardAvoidingView
      behavior="position"
      contentContainerStyle={{ flex: 1 }}
      style={{ flex: 1 }}
      keyboardVerticalOffset={92}
      enabled={Platform.OS === 'ios'}>
      <View style={styles.container}>
        <Maps.ExpoMap
          style={{
            flex: 1,
            width: '100%',
            overflow: 'hidden',
          }}
          ref={ref}
          provider={provider}
          onMapPress={async (event) => {
            await ref.current
              ?.moveCamera({
                target: {
                  latitude:
                    event.nativeEvent.latitude ??
                    // @ts-ignore
                    // .payload won't be necessary when the Record conversion for iOS gets implemented
                    event.nativeEvent.payload.latitude,
                  longitude:
                    event.nativeEvent.longitude ??
                    // @ts-ignore
                    event.nativeEvent.payload.longitude,
                },
                bearing,
                tilt,
                zoom,
                duration: animationDuration,
                animate: animateCamera,
              })
              .then((result) => setSnackbarText('Move ended at:' + JSON.stringify(result)));
          }}
        />
        <Snackbar
          visible={snackbarText !== undefined}
          onDismiss={() => setSnackbarText(undefined)}
          style={{ backgroundColor: 'white' }}
          wrapperStyle={styles.snackbar}
          duration={2000}>
          <Text style={{ color: 'black' }}>{snackbarText}</Text>
        </Snackbar>
        <ScrollView
          style={{ maxHeight: 200, width: '100%' }}
          contentContainerStyle={{ flexGrow: 1, margin: 0, padding: 0 }}>
          <View style={[styles.controls]}>
            <Text style={styles.title}>Press on the map to move the camera!</Text>

            <TouchableOpacity onPress={() => setAnimateCamera(!animateCamera)}>
              <View
                style={[
                  styles.button,
                  styles.shadow,
                  { backgroundColor: animateCamera ? 'lightgreen' : '#FF7F7F' },
                ]}>
                <Text>Animate Camera:{animateCamera ? 'On' : 'Off'}</Text>
              </View>
            </TouchableOpacity>

            {animateCamera && (
              <Input
                valueText="Animation Duration: "
                initialValue="1000"
                onValueChange={(value) => setAnimationDuration(parseInt(value, 10))}
              />
            )}
            <View style={{ flexDirection: 'row' }}>
              <Input
                valueText="Zoom: "
                initialValue="4"
                onValueChange={(value) => setZoom(parseFloat(value))}
              />
              <Input
                valueText="Bearing: "
                initialValue="0"
                onValueChange={(value) => setBearing(parseFloat(value))}
              />
            </View>
            <Input
              valueText="Tilt: "
              initialValue="0"
              onValueChange={(value) => setTilt(parseFloat(value))}
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  controls: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  snackbar: {
    top: 0,
  },
  eventsList: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '400',
    paddingVertical: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 10,
  },
  inputContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  input: {
    borderColor: 'lightgray',
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  shadow: {
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    shadowColor: 'rgba(0,0,0,0.56)',
  },
});

const Input = (props: {
  valueText: string;
  initialValue: string;
  onValueChange: (value: string) => void;
}) => (
  <View style={styles.inputContainer}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text>{props.valueText}</Text>
      <TextInput
        style={styles.input}
        onChangeText={(text) => props.onValueChange(text)}
        defaultValue={props.initialValue}
        keyboardType="decimal-pad"
      />
    </View>
  </View>
);
