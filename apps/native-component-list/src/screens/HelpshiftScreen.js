import * as React from 'react';
import { Dimensions, View } from 'react-native';
import Helpshift from 'helpshift-react-native';
import HelpshiftCredentials from '../../HelpshiftCredentials';

const config = {
  ...HelpshiftCredentials,
  user: {
    identifier: 'none',
    email: 'brent@expo.io',
  },
  height: 500,
  width: Dimensions.get('window').width,
  cifs: {},
};

export default function HelpshiftScreen() {
  return (
    <View style={{ backgroundColor: '#000', flex: 1 }}>
      <Helpshift config={config} style={{ flex: 1, height: 500 }} />
    </View>
  );
}

HelpshiftScreen.navigationOptions = {
  title: 'Helpshift Example',
};
