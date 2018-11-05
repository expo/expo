import React from 'react';
import {
  Alert,
  AsyncStorage,
  Platform,
  ProgressBarAndroid,
  ProgressViewIOS,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Asset, FileSystem } from 'expo';
import ListButton from '../components/ListButton';

export default class FileSystemScreen extends React.Component {
  static navigationOptions = {
    title: 'FileSystem',
  };

  state = {
    downloadProgress: 0,
  };

  _download = async () => {
    const url = 'http://ipv4.download.thinkbroadband.com/5MB.zip';
    const fileUri = FileSystem.documentDirectory + '5MB.zip';
    const callback = downloadProgress => {
      const progress =
        downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      this.setState({
        downloadProgress: progress,
      });
    };
    const options = { md5: true };
    this.download = FileSystem.createDownloadResumable(url, fileUri, options, callback);

    try {
      await this.download.downloadAsync();
      if (this.state.downloadProgress === 1) {
        alert('Download complete!');
      }
    } catch (e) {
      console.log(e);
    }
  };

  _pause = async () => {
    if (this.download == null) {
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
        await this.download.resumeAsync();
        if (this.state.downloadProgress === 1) {
          alert('Download complete!');
        }
      } else {
        this._fetchDownload();
      }
    } catch (e) {
      console.log(e);
    }
  };

  _fetchDownload = async () => {
    try {
      const downloadJson = await AsyncStorage.getItem('pausedDownload');
      if (downloadJson !== null) {
        const downloadFromStore = JSON.parse(downloadJson);
        const callback = downloadProgress => {
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
    if (this.download == null) {
      alert('Initiate a download first!');
      return;
    }
    try {
      let info = await FileSystem.getInfoAsync(this.download._fileUri);
      Alert.alert('File Info:', JSON.stringify(info), [{ text: 'OK', onPress: () => {} }]);
    } catch (e) {
      console.log(e);
    }
  };

  _readAsset = async () => {
    const asset = Asset.fromModule(require('../assets/index.html'));
    await asset.downloadAsync();
    try {
      const result = await FileSystem.readAsStringAsync(asset.localUri);
      Alert.alert('Result', result);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  _getInfoAsset = async () => {
    const asset = Asset.fromModule(require('../assets/index.html'));
    await asset.downloadAsync();
    try {
      const result = await FileSystem.getInfoAsync(asset.localUri);
      Alert.alert('Result', JSON.stringify(result, null, 2));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  _copyAndReadAsset = async () => {
    const asset = Asset.fromModule(require('../assets/index.html'));
    await asset.downloadAsync();
    const tmpFile = FileSystem.cacheDirectory + 'test.html';
    try {
      await FileSystem.copyAsync({ from: asset.localUri, to: tmpFile });
      const result = await FileSystem.readAsStringAsync(tmpFile);
      Alert.alert('Result', result);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  render() {
    let progress = null;
    if (Platform.OS === 'ios') {
      progress = <ProgressViewIOS style={styles.progress} progress={this.state.downloadProgress} />;
    } else {
      progress = (
        <ProgressBarAndroid
          style={styles.progress}
          styleAttr="Horizontal"
          indeterminate={false}
          progress={this.state.downloadProgress}
        />
      );
    }
    return (
      <ScrollView style={{ padding: 10 }}>
        <ListButton onPress={this._download} title="Start Downloading file (5mb)" />
        <ListButton onPress={this._pause} title="Pause Download" />
        <ListButton onPress={this._resume} title="Resume Download" />
        <ListButton onPress={this._getInfo} title="Get Info" />
        {progress}
        <ListButton onPress={this._readAsset} title="Read Asset" />
        <ListButton onPress={this._getInfoAsset} title="Get Info Asset" />
        <ListButton onPress={this._copyAndReadAsset} title="Copy and Read Asset" />
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
