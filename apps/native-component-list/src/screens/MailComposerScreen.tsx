import * as MailComposer from 'expo-mail-composer';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import Button from '../components/Button';
import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';

type State = {
  isAvailable?: boolean;
};

export default class MailComposerScreen extends React.Component<object, State> {
  static navigationOptions = {
    title: 'MailComposer',
  };

  readonly state: State = {};

  componentDidMount() {
    this.checkCapabilitiesAsync();
  }

  async checkCapabilitiesAsync() {
    const isAvailable = await MailComposer.isAvailableAsync();
    this.setState({ isAvailable });
  }

  sendMailAsync = async () => {
    if (!this.state.isAvailable) {
      // On iOS device without Mail app installed it is possible to show mail composer,
      // but it isn't possible to send that email either way.
      alert(
        "It's not possible to send an email on this device. Make sure you have mail account configured and Mail app installed (iOS)."
      );
      return;
    }

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

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.capabilitiesContainer}>
          <HeadingText>MailComposer.isAvailableAsync()</HeadingText>
          <MonoText>{JSON.stringify(this.state.isAvailable)}</MonoText>
        </View>
        <Button onPress={this.sendMailAsync} title="Send birthday wishes" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capabilitiesContainer: {
    alignItems: 'stretch',
    paddingBottom: 20,
  },
});
