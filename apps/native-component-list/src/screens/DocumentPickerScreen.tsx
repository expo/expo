import * as DocumentPicker from 'expo-document-picker';
import React from 'react';
import { Alert, Image, Text, View } from 'react-native';

import Button from '../components/Button';
import TitleSwitch from '../components/TitledSwitch';

export default function DocumentPickerScreen() {
  const [copyToCache, setCopyToCache] = React.useState(false);
  const [document, setDocument] = React.useState<DocumentPicker.DocumentResult | null>(null);

  const openPicker = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: copyToCache,
    });
    if (result.type === 'success') {
      setDocument(result);
    } else {
      setTimeout(() => {
        Alert.alert('Document picked', JSON.stringify(result, null, 2));
      }, 100);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button onPress={openPicker} title="Open document picker" />
      <TitleSwitch
        style={{ marginVertical: 24 }}
        value={copyToCache}
        setValue={setCopyToCache}
        title="Copy to cache"
      />
      {document?.type === 'success' && (
        <View>
          {document.name!.match(/\.(png|jpg)$/gi) ? (
            <Image
              source={{ uri: document.uri }}
              resizeMode="cover"
              style={{ width: 100, height: 100 }}
            />
          ) : null}
          <Text>
            {document.name} ({document.size! / 1000} KB)
          </Text>
          <Text>URI: {document.uri}</Text>
        </View>
      )}
    </View>
  );
}

DocumentPickerScreen.navigationOptions = {
  title: 'DocumentPicker',
};
