import { Directory, File, Paths } from 'expo-file-system/next';
import React from 'react';
import { ScrollView } from 'react-native';

import ListButton from '../components/ListButton';

export default function FileSystemNextScreen() {
  const _download = async () => {
    const url = 'https://getsamplefiles.com/download/zip/sample-3.zip';
    const destination = new Directory(Paths.document, 'tests');
    try {
      destination.create();
      const output = await File.downloadFileAsync(url, destination);
      console.log(output.exists); // true
      console.log(output.uri); // path to the downloaded file, e.g. '${documentDirectory}/tests/sample-1.zip'
    } catch (error) {
      console.error(error);
    }
  };

  const _upload = async () => {
    const url = 'http://localhost:3000/upload';
    const file = new File(Paths.document, 'tests/sample-3.zip');
    try {
      await file.uploadAsync(url, { fieldName: 'test' });
      console.log('Upload completed');
    } catch (error) {
      console.error({ error });
    }
  };

  return (
    <ScrollView style={{ padding: 10 }}>
      <ListButton onPress={_download} title="Download file" />
      <ListButton onPress={_upload} title="Upload file" />
    </ScrollView>
  );
}
