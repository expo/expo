import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
// import * as Progress from 'expo-progress';
import type {
  DownloadProgressData,
  DownloadResumable,
  FileSystemNetworkTaskProgressCallback,
  UploadProgressData,
  UploadTask,
} from 'expo-file-system';
import React from 'react';
import { Alert, ScrollView, Text, Platform } from 'react-native';

import HeadingText from '../components/HeadingText';
import ListButton from '../components/ListButton';
import SimpleActionDemo from '../components/SimpleActionDemo';

const { StorageAccessFramework } = FileSystem;

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

  readonly state: State = {
    downloadProgress: 0,
    uploadProgress: 0,
    permittedURI: null,
    createdFileURI: null,
  };

  download?: DownloadResumable;
  upload?: UploadTask;

  _download = async () => {
    const url = 'https://getsamplefiles.com/download/zip/sample-1.zip';
    await FileSystem.downloadAsync(url, FileSystem.documentDirectory + 'sample-1.zip');
    alert('Download complete!');
  };

  _startDownloading = async () => {
    const url = 'https://getsamplefiles.com/download/zip/sample-5.zip';
    const fileUri = FileSystem.documentDirectory + 'sample-5.zip';
    const callback: FileSystemNetworkTaskProgressCallback<DownloadProgressData> = (
      downloadProgress
    ) => {
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

  _cancel = async () => {
    if (!this.download) {
      alert('Initiate a download first!');
      return;
    }

    try {
      await this.download.cancelAsync();
      delete this.download;
      await AsyncStorage.removeItem('pausedDownload');
      this.setState({
        downloadProgress: 0,
      });
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
        const callback: FileSystemNetworkTaskProgressCallback<DownloadProgressData> = (
          downloadProgress
        ) => {
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
      }
    } catch (e) {
      console.log(e);
    }
  };

  _upload = async () => {
    try {
      const fileUri = FileSystem.documentDirectory + 'sample-4.zip';
      const downloadUrl = 'https://getsamplefiles.com/download/zip/sample-4.zip';
      await FileSystem.downloadAsync(downloadUrl, fileUri);

      const callback: FileSystemNetworkTaskProgressCallback<UploadProgressData> = (
        uploadProgress
      ) => {
        const progress = uploadProgress.totalBytesSent / uploadProgress.totalBytesExpectedToSend;
        this.setState({
          uploadProgress: progress,
        });
      };
      const uploadUrl = 'https://httpbin.org/post';
      this.upload = FileSystem.createUploadTask(uploadUrl, fileUri, {}, callback);

      await this.upload.uploadAsync();
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
      const info = await FileSystem.getInfoAsync(this.download.fileUri);
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
    alert(
      `${Math.round(freeBytes / 1024 / 1024)} MB (1MB = 1024^2B), or ${Math.round(freeBytes / 1000000)} MB (1MB = 1000^2B) available.`
    );
  };

  _askForDirPermissions = async () => {
    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (permissions.granted) {
      const url = permissions.directoryUri;
      this.setState({
        permittedURI: url,
      });
      alert(`You selected: ${url}`);
    }
  };

  _readSAFDirAsync = async () => {
    return await StorageAccessFramework.readDirectoryAsync(this.state.permittedURI!);
  };

  _creatSAFFileAsync = async () => {
    const createdFile = await StorageAccessFramework.createFileAsync(
      // eslint-disable-next-line react/no-access-state-in-setstate
      this.state.permittedURI!,
      'test',
      'text/plain'
    );

    this.setState({
      createdFileURI: createdFile,
    });

    return createdFile;
  };

  _writeToSAFFileAsync = async () => {
    await StorageAccessFramework.writeAsStringAsync(
      this.state.createdFileURI!,
      'Expo is awesome 🚀🚀🚀'
    );

    return 'Done 👍';
  };

  _readSAFFileAsync = async () => {
    return await StorageAccessFramework.readAsStringAsync(this.state.createdFileURI!);
  };

  _deleteSAFFileAsync = async () => {
    await StorageAccessFramework.deleteAsync(this.state.createdFileURI!);

    this.setState({
      createdFileURI: null,
    });
  };

  _copySAFFileToInternalStorageAsync = async () => {
    const outputDir = FileSystem.cacheDirectory! + '/SAFTest';
    await StorageAccessFramework.copyAsync({
      from: this.state.createdFileURI!,
      to: outputDir,
    });

    return await FileSystem.readDirectoryAsync(outputDir);
  };

  _moveSAFFileToInternalStorageAsync = async () => {
    await StorageAccessFramework.moveAsync({
      from: this.state.createdFileURI!,
      to: FileSystem.cacheDirectory!,
    });

    this.setState({
      createdFileURI: null,
    });
  };

  _downloadAndReadLocalAsset = async () => {
    const asset = Asset.fromModule(require('../../assets/index.html')).uri;
    const tmpFile = FileSystem.cacheDirectory + 'test.html';
    try {
      await FileSystem.downloadAsync(asset, tmpFile);
      const result = await FileSystem.readAsStringAsync(tmpFile);
      Alert.alert('Result', result);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  render() {
    return (
      <ScrollView style={{ padding: 10 }}>
        <ListButton onPress={this._download} title="Download file (1.1MB)" />
        <ListButton onPress={this._startDownloading} title="Start Downloading file (8.4MB)" />
        {this.state.downloadProgress ? (
          <Text style={{ paddingVertical: 15 }}>
            Download progress: {this.state.downloadProgress * 100}%
          </Text>
        ) : null}
        {/* Add back progress bar once deprecation warnings from reanimated 2 are resolved */}
        {/* <Progress.Bar style={styles.progress} isAnimated progress={this.state.downloadProgress} /> */}
        <ListButton onPress={this._pause} title="Pause Download" />
        <ListButton onPress={this._resume} title="Resume Download" />
        <ListButton onPress={this._cancel} title="Cancel Download" />
        <ListButton onPress={this._upload} title="Download & Upload file (2.8MB)" />
        {this.state.uploadProgress ? (
          <Text style={{ paddingVertical: 15 }}>
            Upload progress: {this.state.uploadProgress * 100}%
          </Text>
        ) : null}
        <ListButton onPress={this._getInfo} title="Get Info" />
        <ListButton onPress={this._readAsset} title="Read Asset" />
        <ListButton onPress={this._getInfoAsset} title="Get Info Asset" />
        <ListButton onPress={this._copyAndReadAsset} title="Copy and Read Asset" />
        <ListButton onPress={this._alertFreeSpace} title="Alert free space" />
        <ListButton
          onPress={this._downloadAndReadLocalAsset}
          title="Download and read local asset"
        />
        {Platform.OS === 'android' && (
          <>
            <HeadingText>Storage Access Framework</HeadingText>
            <ListButton
              onPress={this._askForDirPermissions}
              title="Ask for directory permissions"
            />
            {this.state.permittedURI && (
              <>
                <SimpleActionDemo title="Read directory" action={this._readSAFDirAsync} />
                <SimpleActionDemo title="Create a file" action={this._creatSAFFileAsync} />

                {this.state.createdFileURI && (
                  <>
                    <SimpleActionDemo
                      title="Write to created file"
                      action={this._writeToSAFFileAsync}
                    />
                    <SimpleActionDemo
                      title="Read from created file"
                      action={this._readSAFFileAsync}
                    />
                    <ListButton title="Delete created file" onPress={this._deleteSAFFileAsync} />
                    <SimpleActionDemo
                      title="Copy file to internal storage"
                      action={this._copySAFFileToInternalStorageAsync}
                    />
                    <ListButton
                      title="Move file to internal storage"
                      onPress={this._moveSAFFileToInternalStorageAsync}
                    />
                  </>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    );
  }
}
