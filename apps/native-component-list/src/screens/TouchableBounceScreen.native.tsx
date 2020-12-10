import * as React from 'react';
import { Text } from 'react-native';
// @ts-ignore
import TouchableBounce from 'react-native/Libraries/Components/Touchable/TouchableBounce';

import { Page, Section } from '../components/Page';
import Colors from '../constants/Colors';

// TODO: Deprecate
export default function TouchableBounceScreen() {
  const buttonStyle = {
    paddingHorizontal: 25,
    paddingVertical: 20,
    marginRight: 10,
    backgroundColor: Colors.tintColor,
    borderRadius: 5,
  };

  const buttonText = {
    color: '#fff',
  };

  return (
    <Page>
      <Section title="Default">
        <TouchableBounce style={buttonStyle} onPress={() => {}}>
          <Text style={buttonText}>Bounce!</Text>
        </TouchableBounce>
      </Section>
    </Page>
  );
}

TouchableBounceScreen.navigationOptions = {
  title: 'TouchableBounce',
};
