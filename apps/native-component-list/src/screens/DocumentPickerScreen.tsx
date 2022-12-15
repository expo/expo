import * as DocumentPicker from 'expo-document-picker';
import { DocumentData } from 'expo-document-picker/build/types';
import React from 'react';
import { Alert, FlatList, Image, Platform, Text, View } from 'react-native';

import Button from '../components/Button';
import TitleSwitch from '../components/TitledSwitch';

export default function DocumentPickerScreen() {
  const [copyToCache, setCopyToCache] = React.useState(false);
  const [multiple, setMultiple] = React.useState(false);
  const [documents, setDocuments] = React.useState<DocumentPicker.DocumentResult | null>(null);

  const openPicker = async () => {
    const time = Date.now();
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: copyToCache,
      multiple,
    });
    console.log(`Duration: ${Date.now() - time}ms`);
    console.log(`Results:`, result);
    if (Array.isArray(result)) {
      setDocuments(result);
    } else if (result.type === 'success') {
      setDocuments([result]);
    } else {
      setTimeout(() => {
        if (Platform.OS === 'web') {
          alert('Cancelled');
        } else {
          Alert.alert('Cancelled');
        }
      }, 100);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button onPress={openPicker} title="Open document picker" />
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
      <FlatList
        data={Array.isArray(documents) ? documents : []}
        keyExtractor={(item) => item.uri}
        renderItem={({ item: document }) => {
          return <DocumentView document={document} />;
        }}
      />
    </View>
  );
}

function DocumentView({ document }: { document: DocumentData }) {
  return (
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
      <Text>
        URI: {document.uri} MimeType: {document.mimeType}
      </Text>
    </View>
  );
}

DocumentPickerScreen.navigationOptions = {
  title: 'DocumentPicker',
};
