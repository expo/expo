import * as FileSystem from 'expo-file-system/next';
// import * as Progress from 'expo-progress';
import React from 'react';
import { ScrollView } from 'react-native';

import ListButton from '../components/ListButton';

interface State {
  downloadProgress: number;
  uploadProgress: number;
  permittedURI: string | null;
  createdFileURI: string | null;
}

export default class FileSystemScreen extends React.Component<object, State> {
  static navigationOptions = {
    title: 'FileSystem',
  };

  render() {
    return (
      <ScrollView style={{ padding: 10 }}>
        <ListButton
          onPress={() => {
            const test1 = new FileSystem.TestSO();
            console.log('Test1 size:', test1.size);
            const test2 = new FileSystem.TestSO();
            console.log('Test2 size:', test2.size);
            const test = new FileSystem.TestSO([test1, test2]);
            console.log('Test size:', test.size);
          }}
          title="Create TestSO"
        />
      </ScrollView>
    );
  }
}
