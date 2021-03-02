import AsyncStorage from '@react-native-community/async-storage';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as Progress from 'expo-progress';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Platform } from 'react-native';

import ListButton from '../components/ListButton';

interface State {
  downloadProgress: number;
}

// See: https://github.com/expo/expo/pull/10229#discussion_r490961694
// eslint-disable-next-line @typescript-eslint/ban-types
export default class FileSystemScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'FileSystem',
  };

  readonly state: State = {
    downloadProgress: 0,
  };

  download?: FileSystem.DownloadResumable;

  _download = async () => {
    const url = 'http://ipv4.download.thinkbroadband.com/256KB.zip';
    await FileSystem.downloadAsync(url, FileSystem.documentDirectory + '256KB.zip');
    alert('Download complete!');
  };

  _startDownloading = async () => {
    const url = 'http://ipv4.download.thinkbroadband.com/5MB.zip';
    const fileUri = FileSystem.documentDirectory + '5MB.zip';
    const callback: FileSystem.DownloadProgressCallback = downloadProgress => {
      const progress =
        downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      this.setState({
        downloadProgress: progress,
      });
    };
    const options = { md5: true };
    this.download = FileSystem.createDownloadResumable(url, fileUri, options, callback);

    try {
      const result = await this.download.downloadAsync();
      if (result) {
        this._downloadComplete();
      }
    } catch (e) {
      console.log(e);
    }
  };

  _pause = async () => {
    if (!this.download) {
      alert('Initiate a download first!');
      return;
    }
    try {
      const downloadSnapshot = await this.download.pauseAsync();
      await AsyncStorage.setItem('pausedDownload', JSON.stringify(downloadSnapshot));
      alert('Download paused...');
    } catch (e) {
      console.log(e);
    }
  };

  _resume = async () => {
    try {
      if (this.download) {
        const result = await this.download.resumeAsync();
        if (result) {
          this._downloadComplete();
        }
      } else {
        this._fetchDownload();
      }
    } catch (e) {
      console.log(e);
    }
  };

  _downloadComplete = () => {
    if (this.state.downloadProgress !== 1) {
      this.setState({
        downloadProgress: 1,
      });
    }
    alert('Download complete!');
  };

  _fetchDownload = async () => {
    try {
      const downloadJson = await AsyncStorage.getItem('pausedDownload');
      if (downloadJson !== null) {
        const downloadFromStore = JSON.parse(downloadJson);
        const callback: FileSystem.DownloadProgressCallback = downloadProgress => {
          const progress =
            downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          this.setState({
            downloadProgress: progress,
          });
        };
        this.download = new FileSystem.DownloadResumable(
          downloadFromStore.url,
          downloadFromStore.fileUri,
          downloadFromStore.options,
          callback,
          downloadFromStore.resumeData
        );
        await this.download.resumeAsync();
        if (this.state.downloadProgress === 1) {
          alert('Download complete!');
        }
      } else {
        alert('Initiate a download first!');
        return;
      }
    } catch (e) {
      console.log(e);
    }
  };

  _getInfo = async () => {
    if (!this.download) {
      alert('Initiate a download first!');
      return;
    }
    try {
      const info = await FileSystem.getInfoAsync(this.download._fileUri);
      Alert.alert('File Info:', JSON.stringify(info), [{ text: 'OK', onPress: () => {} }]);
    } catch (e) {
      console.log(e);
    }
  };

  _readAsset = async () => {
    const asset = Asset.fromModule(require('../../assets/index.html'));
    await asset.downloadAsync();
    try {
      const result = await FileSystem.readAsStringAsync(asset.localUri!);
      Alert.alert('Result', result);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  _getInfoAsset = async () => {
    const asset = Asset.fromModule(require('../../assets/index.html'));
    await asset.downloadAsync();
    try {
      const result = await FileSystem.getInfoAsync(asset.localUri!);
      Alert.alert('Result', JSON.stringify(result, null, 2));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  _copyAndReadAsset = async () => {
    const asset = Asset.fromModule(require('../../assets/index.html'));
    await asset.downloadAsync();
    const tmpFile = FileSystem.cacheDirectory + 'test.html';
    try {
      await FileSystem.copyAsync({ from: asset.localUri!, to: tmpFile });
      const result = await FileSystem.readAsStringAsync(tmpFile);
      Alert.alert('Result', result);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  _alertFreeSpace = async () => {
    const freeBytes = await FileSystem.getFreeDiskStorageAsync();
    alert(`${Math.round(freeBytes / 1024 / 1024)} MB available`);
  };

  _askForDirPermissions = async () => {
    const uri = await FileSystem.askForDirectoryPermissionsAsync();
    if (uri) {
      const files = await FileSystem.readDirectoryAsync(uri);
      alert(`Files inside ${uri}:\n\n${JSON.stringify(files)}`);
    }
  };

  render() {
    return (
      <ScrollView style={{ padding: 10 }}>
        <ListButton onPress={this._download} title="Download file (512KB)" />
        <ListButton onPress={this._startDownloading} title="Start Downloading file (5MB)" />
        <ListButton onPress={this._pause} title="Pause Download" />
        <ListButton onPress={this._resume} title="Resume Download" />
        <ListButton onPress={this._getInfo} title="Get Info" />
        <Progress.Bar style={styles.progress} isAnimated progress={this.state.downloadProgress} />
        <ListButton onPress={this._readAsset} title="Read Asset" />
        <ListButton onPress={this._getInfoAsset} title="Get Info Asset" />
        <ListButton onPress={this._copyAndReadAsset} title="Copy and Read Asset" />
        <ListButton onPress={this._alertFreeSpace} title="Alert free space" />
        {Platform.OS === 'android' && (
          <ListButton onPress={this._askForDirPermissions} title="Ask for directory permissions" />
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  progress: {
    marginHorizontal: 10,
    marginVertical: 32,
  },
});
