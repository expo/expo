import * as React from 'react';
import {
  Platform,
  Text,
  TouchableHighlight,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
} from 'react-native';

import { Page, Section } from '../components/Page';
import Colors from '../constants/Colors';

export default function TouchablesScreen() {
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
      <Section title="TouchableHighlight">
        <TouchableHighlight
          underlayColor="rgba(1, 1, 255, 0.9)"
          style={buttonStyle}
          onPress={() => {}}>
          <Text style={buttonText}>Highlight!</Text>
        </TouchableHighlight>
      </Section>

      <Section title="TouchableOpacity">
        <TouchableOpacity style={buttonStyle} onPress={() => {}}>
          <Text style={buttonText}>Opacity!</Text>
        </TouchableOpacity>
      </Section>

      {Platform.OS === 'android' && (
        <Section title="TouchableNativeFeedback">
          <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple('#fff', false)}
            onPress={() => {}}
            delayPressIn={0}>
            <View style={buttonStyle}>
              <Text style={buttonText}>Native feedback!</Text>
            </View>
          </TouchableNativeFeedback>
        </Section>
      )}
    </Page>
  );
}

TouchablesScreen.navigationOptions = {
  title: 'Touchables',
};
