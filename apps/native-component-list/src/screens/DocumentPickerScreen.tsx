import React from 'react';
import { Alert, Image, Text, View, Switch } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Button from '../components/Button';

interface State {
  document?: DocumentPicker.DocumentResult;
  copyToCache: boolean;
}

export default class DocumentPickerScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'DocumentPicker',
  };

  readonly state: State = {
    copyToCache: false,
  };

  _openPicker = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: this.state.copyToCache,
    });
    if (result.type === 'success') {
      this.setState({ document: result });
    } else {
      setTimeout(() => {
        Alert.alert('Document picked', JSON.stringify(result, null, 2));
      }, 100);
    }
  }

  _renderDocument() {
    if (!this.state.document) {
      return null;
    }
    return (
      <View>
        {this.state.document.name!.match(/\.(png|jpg)$/gi) ? (
          <Image
            source={{ uri: this.state.document.uri }}
            resizeMode="cover"
            style={{ width: 100, height: 100 }}
          />
        ) : null}
        <Text>
          {this.state.document.name} ({this.state.document.size! / 1000} KB)
        </Text>
        <Text>URI: {this.state.document.uri}</Text>
      </View>
    );
  }

  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Button onPress={this._openPicker} title="Open document picker" />
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
          }}
        >
          <Text>Copy to cache</Text>
          <Switch
            value={this.state.copyToCache}
            onValueChange={value => this.setState({ copyToCache: value })}
          />
        </View>
        {this._renderDocument()}
      </View>
    );
  }
}
