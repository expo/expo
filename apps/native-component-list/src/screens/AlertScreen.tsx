import * as React from 'react';
import { Alert, Platform } from 'react-native';

import Button from '../components/Button';
import { Page, Section } from '../components/Page';

export default function AlertExample() {
  const showPrompt = () => {
    Alert.prompt('Enter a value', undefined, (text) => console.log(`You entered ${text}`));
  };

  const showAlert = () => {
    Alert.alert('Alert Title', 'My Alert Msg', [
      {
        text: 'Ask me later',
        onPress: () => console.log('Ask me later pressed'),
      },
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      { text: 'OK', onPress: () => console.log('OK Pressed') },
    ]);
  };

  return (
    <Page>
      <Section title="Default" row>
        <Button disabled={Platform.OS !== 'ios'} onPress={showPrompt} title="Prompt for a value" />
        <Button onPress={showAlert} title="Give me some options" />
      </Section>
    </Page>
  );
}

AlertExample.navigationOptions = {
  title: 'Alert',
};
