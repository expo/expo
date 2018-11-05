import React from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { MailComposer } from 'expo';
import Button from '../components/Button';

export default class MailComposerScreen extends React.Component {
  static navigationOptions = {
    title: 'MailComposer',
  };

  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Button onPress={this._sendMailAsync} title="Send birthday wishes" />
      </View>
    );
  }

  _sendMailAsync = async () => {
    try {
      const { status } = await MailComposer.composeAsync({
        subject: 'Wishes',
        body: 'Dear Friend! <b>Happy</b> Birthday, enjoy your day! 🎈',
        recipients: ['sample.mail@address.com'],
        isHtml: true,
      });
      if (status === 'sent') {
        Alert.alert('Mail sent!');
      } else {
        throw new Error(`composeAsync() returned status: ${status}`);
      }
    } catch (e) {
      Alert.alert('Something went wrong: ', e.message);
    }
  };
}
