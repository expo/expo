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
import { FileSystem } from 'expo-file-system';
import ListButton from '../components/ListButton';

export default class FileSystemScreen extends React.Component {
  static navigationOptions = {
    title: 'FileSystem',
  };

  state = {
    downloadProgress: 0,
  };

  _download = async () => {
    const url = 'https://pl.mouser.com/catalog/English/103/dload/pdf/POWERSECTION.pdf';
    const fileUri = FileSystem.documentDirectory + '5MB.pdf';
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
      Alert.alert('File Info:', JSON.stringify(info), [{ text: 'OK', onPress: () => { } }]);
    } catch (e) {
      console.log(e);
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
