import React from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { DocumentPicker } from 'expo';
import Button from '../components/Button';

export default class DocumentPickerScreen extends React.Component {
  static navigationOptions = {
    title: 'DocumentPicker',
  };
  
  state = {
    document: null,
  };

  _openPicker = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (result.type === 'success') {
      this.setState({ document: result });
    } else {
      setTimeout(() => {
        Alert.alert('Document picked', JSON.stringify(result, null, 2));
      }, 100);
    }
  };

  _renderDocument() {
    if (this.state.document === null) {
      return null;
    }
    return (
      <View>
        {this.state.document.uri.match(/\.(png|jpg)$/gi) ? (
          <Image
            source={{ uri: this.state.document.uri }}
            resizeMode="cover"
            style={{ width: 100, height: 100 }}
          />
        ) : null}
        <Text>
          {this.state.document.name} ({this.state.document.size / 1000} KB)
        </Text>
      </View>
    );
  }

  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Button onPress={this._openPicker} title="Open document picker" />
        {this._renderDocument()}
      </View>
    );
  }
}
