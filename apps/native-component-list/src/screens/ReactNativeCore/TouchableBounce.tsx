import * as React from 'react';
import { Text } from 'react-native';

import Colors from '../../constants/Colors';
import { Page, Section } from './CommonViews';

// @ts-ignore
import TouchableBounce from 'react-native/Libraries/Components/Touchable/TouchableBounce';

// TODO: Deprecate
export function TouchableBounceExample() {
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
