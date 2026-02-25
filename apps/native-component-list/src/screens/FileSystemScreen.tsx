import { Paths, File, PickFileOptions } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { useState } from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  View,
  Text,
  Alert,
  FlatList,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';

import HeadingText from '../components/HeadingText';
import TitleSwitch from '../components/TitledSwitch';
import NCLButton from '../components/Button';

FileSystemScreen.navigationOptions = {
  title: 'FileSystem',
};

export default function FileSystemScreen() {
  const { width } = useWindowDimensions();
  const [copyToCache, setCopyToCache] = useState(false);
  const [multiple, setMultiple] = useState(false);
  const [initialUri, setInitialUri] = useState(false);
  const [pickerResult, setPickerResult] = useState<File | File[] | null>(null);

  const openPicker = async () => {
    try {
      const time = Date.now();
      let canceled = false;
      let result = null;
      try {
        result = multiple
          ? await File.pickFileAsync({
              multipleFiles: true,
            })
          : await File.pickFileAsync({ multipleFiles: false });
      } catch (e) {
        canceled = true;
      }
      console.log(`Duration: ${Date.now() - time}ms`);
      console.log(`Results:`, result);
      if (result) {
        setPickerResult(result);
      } else {
        setTimeout(() => {
          if (Platform.OS === 'web') {
            alert('Cancelled');
          } else {
            Alert.alert('Cancelled');
          }
        }, 100);
      }
    } catch (err) {
      console.error('Error picking document:', err);
      setTimeout(() => {
        Alert.alert('error', `Error picking document: ${err}`);
      }, 150);
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <HeadingText>.contentUri property</HeadingText>
        <Button
          title="From file"
          onPress={async () => {
            const file = new File(Paths.cache, 'file.txt');
            file.write('123');
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: file.contentUri,
              flags: 1,
              type: 'text/plain',
            });
          }}
        />
        <Text>Open .pem certificate from BareExpo (should show modal that it's not possible)</Text>
        <Button
          title="From asset"
          onPress={async () => {
            const file = new File(Paths.bundle, 'expo-root.pem');
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: file.contentUri,
              flags: 1,
              type: 'application/x-pem-file',
            });
          }}
        />
        <Button
          title="From SAF"
          onPress={async () => {
            const res = await File.pickFileAsync();
            const file = Array.isArray(res) ? res[0] : res;
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: file.contentUri,
              flags: 1,
              type: file.type,
            });
          }}
        />
      </View>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View
          style={{ marginBottom: 20, marginTop: 20, paddingHorizontal: 20, gap: 5, minWidth: 300 }}>
          <NCLButton
            onPress={openPicker}
            title="Open document picker"
            buttonStyle={{ width: '100%' }}
          />
          <TitleSwitch
            style={{ marginVertical: 10 }}
            value={copyToCache}
            setValue={setCopyToCache}
            title="Copy to cache"
          />
          <TitleSwitch
            style={{ marginVertical: 10 }}
            value={multiple}
            setValue={setMultiple}
            title="Pick multiple"
          />
        </View>

        <View
          style={{
            padding: 20,
            maxWidth: width - 40,
            width: '100%',
            justifyContent: 'flex-start',
          }}>
          {Array.of(pickerResult)
            .flat()
            .map((document, index) => {
              if (!document) return null;

              return (
                <View
                  key={`${index}-${document?.contentUri}`}
                  style={{ marginBottom: 20, width: '100%', flex: 1 }}>
                  {document?.name!.match(/\.(png|jpg)$/gi) ? (
                    <Image
                      source={{ uri: document.uri }}
                      resizeMode="cover"
                      style={{ width: 100, height: 100 }}
                    />
                  ) : null}
                  <Text numberOfLines={1} ellipsizeMode="middle">
                    {document?.name} ({document?.size! / 1000} KB)
                  </Text>
                  <Text numberOfLines={1} ellipsizeMode="middle">
                    URI: {document?.uri}
                  </Text>
                  <Text numberOfLines={1} ellipsizeMode="middle">
                    MimeType: {document?.type}
                  </Text>
                  <Text>Last Modified: {document?.lastModified}</Text>
                </View>
              );
            })}
        </View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  languageBox: {
    padding: 10,
    borderWidth: 1,
  },
  picker: {
    borderWidth: 1,
    padding: 0,
    margin: 0,
  },
  container: {
    padding: 10,
    gap: 10,
  },
});
