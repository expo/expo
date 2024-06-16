import { Picker } from '@react-native-picker/picker';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import OpenAuthSessionAsyncDemo from './OpenAuthSessionAsyncDemo';
import OpenBrowserAsyncDemo from './OpenBrowserAsyncDemo';
import Button from '../../components/Button';

const url = 'https://expo.dev';
interface Package {
  label: string;
  value: string;
}

WebBrowserScreen.navigationOptions = {
  title: 'WebBrowser',
};

export default function WebBrowserScreen() {
  const [packages, setPackages] = useState<Package[] | undefined>(undefined);
  const [selectedPackage, setSelectedPackage] = useState<string | undefined>(undefined);
  const [lastWarmedPackage, setLastWarmedPackage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (Platform.OS === 'android') {
      WebBrowser.getCustomTabsSupportingBrowsersAsync()
        .then(({ browserPackages }) =>
          browserPackages.map((name) => ({ label: name, value: name }))
        )
        .then((packages) => setPackages(packages));
    }

    return () => {
      if (Platform.OS === 'android') {
        WebBrowser.coolDownAsync(lastWarmedPackage);
      }
    };
  }, []);

  const showPackagesAlert = async () => {
    const result = await WebBrowser.getCustomTabsSupportingBrowsersAsync();
    Alert.alert('Result', JSON.stringify(result, null, 2));
  };

  const handleWarmUpClicked = async () => {
    const before = selectedPackage;
    setLastWarmedPackage(selectedPackage);
    const result = await WebBrowser.warmUpAsync(before);
    Alert.alert('Result', JSON.stringify(result, null, 2));
  };

  const handleMayInitWithUrlClicked = async () => {
    const before = selectedPackage;
    setLastWarmedPackage(selectedPackage);
    const result = await WebBrowser.mayInitWithUrlAsync(url, before);
    Alert.alert('Result', JSON.stringify(result, null, 2));
  };

  const handleCoolDownClicked = async () => {
    const result = await WebBrowser.coolDownAsync(selectedPackage);
    Alert.alert('Result', JSON.stringify(result, null, 2));
  };

  const packageSelected = (value: string | number) => {
    if (typeof value === 'string') setSelectedPackage(value);
  };

  const renderAndroidChoices = () =>
    Platform.OS === 'android' && (
      <>
        <View style={styles.label}>
          <Text>Force package:</Text>
          <Picker
            style={styles.picker}
            selectedValue={selectedPackage}
            onValueChange={packageSelected}>
            {packages &&
              [{ label: '(none)', value: '' }, ...packages].map(({ value, label }) => (
                <Picker.Item key={value} label={label} value={value} />
              ))}
          </Picker>
        </View>
      </>
    );

  const renderAndroidButtons = () =>
    Platform.OS === 'android' && (
      <>
        <Button style={styles.button} onPress={handleWarmUpClicked} title="Warm up." />
        <Button
          style={styles.button}
          onPress={handleMayInitWithUrlClicked}
          title="May init with url."
        />
        <Button style={styles.button} onPress={handleCoolDownClicked} title="Cool down." />
        <Button
          style={styles.button}
          onPress={showPackagesAlert}
          title="Show supporting browsers."
        />
      </>
    );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <OpenBrowserAsyncDemo />
      <OpenAuthSessionAsyncDemo />
      {renderAndroidButtons()}
      {renderAndroidChoices()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  label: {
    paddingBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  picker: {
    padding: 10,
    width: 150,
  },
  button: {
    marginVertical: 10,
    alignItems: 'flex-start',
  },
});
