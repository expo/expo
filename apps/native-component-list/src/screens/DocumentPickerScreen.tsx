import * as DocumentPicker from 'expo-document-picker';
import React from 'react';
import { Alert, FlatList, Image, Platform, Text, useWindowDimensions, View } from 'react-native';

import Button from '../components/Button';
import TitleSwitch from '../components/TitledSwitch';

export default function DocumentPickerScreen() {
  const { width } = useWindowDimensions();
  const [copyToCache, setCopyToCache] = React.useState(false);
  const [multiple, setMultiple] = React.useState(false);
  const [base64, setBase64] = React.useState(false);
  const [pickerResult, setPickerResult] =
    React.useState<DocumentPicker.DocumentPickerResult | null>(null);

  const openPicker = async () => {
    try {
      const time = Date.now();
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: copyToCache,
        multiple,
        base64,
      });
      console.log(`Duration: ${Date.now() - time}ms`);
      console.log(`Results:`, result);
      if (!result.canceled) {
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
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{ marginBottom: 20, marginTop: 20, paddingHorizontal: 20, gap: 5, minWidth: 300 }}>
        <Button onPress={openPicker} title="Open document picker" buttonStyle={{ width: '100%' }} />
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
        <TitleSwitch
          style={{ marginVertical: 10 }}
          value={base64}
          setValue={setBase64}
          title="Base64 (web only)"
        />
      </View>

      <FlatList
        data={pickerResult?.assets}
        contentContainerStyle={{
          padding: 20,
          maxWidth: width - 40,
          justifyContent: 'flex-start',
        }}
        keyExtractor={(item, index) => `${index}-${item.uri}`}
        renderItem={({ item: document }) => {
          return (
            <View style={{ marginBottom: 20, width: '100%', flex: 1 }}>
              {document.name!.match(/\.(png|jpg)$/gi) ? (
                <Image
                  source={{ uri: document.uri }}
                  resizeMode="cover"
                  style={{ width: 100, height: 100 }}
                />
              ) : null}
              <Text numberOfLines={1} ellipsizeMode="middle">
                {document.name} ({document.size! / 1000} KB)
              </Text>
              {document.base64 ? (
                <Text numberOfLines={1} ellipsizeMode="middle">
                  Base64: {document.base64.slice(0, 50)}...
                </Text>
              ) : null}
              <Text numberOfLines={1} ellipsizeMode="middle">
                URI: {document.uri}
              </Text>
              <Text numberOfLines={1} ellipsizeMode="middle">
                MimeType: {document.mimeType}
              </Text>
              <Text>Last Modified: {document.lastModified}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

DocumentPickerScreen.navigationOptions = {
  title: 'DocumentPicker',
};
