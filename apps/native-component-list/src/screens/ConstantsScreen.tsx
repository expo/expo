import Constants from 'expo-constants';
import React from 'react';
import { ScrollView, View } from 'react-native';

import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';
import Colors from '../constants/Colors';

interface State {
  value?: string | (() => void);
  error?: Error;
}

class ExpoConstant extends React.Component<{ value?: any; name: string }, State> {
  readonly state: State = {};

  componentDidMount() {
    this.updateValue();
  }

  async updateValue() {
    let value = this.props.value;

    if (!value) {
      value = Constants[this.props.name];
    }
    if (typeof value === 'function') {
      try {
        value = await this.props.value();
      } catch (error) {
        console.error(error);
        this.setState({ error: error.message });
      }
    }
    if (typeof value === 'object') {
      value = JSON.stringify(value, null, 2);
    } else if (typeof value === 'boolean') {
      value = value ? 'true' : 'false';
    }
    this.setState({ value });
  }

  render() {
    const { value, error } = this.state;
    const { name } = this.props;

    if (!value || typeof value === 'function') {
      return null;
    }

    return (
      <View style={{ marginBottom: 10 }}>
        <HeadingText>{name}</HeadingText>
        <MonoText containerStyle={error && { borderColor: 'red' }}>{error || value}</MonoText>
      </View>
    );
  }
}

// Ignore deprecated properties
const IGNORED_CONSTANTS = ['__unsafeNoWarnManifest', 'linkingUrl'];

export default class ConstantsScreen extends React.PureComponent {
  render() {
    return (
      <ScrollView style={{ padding: 10, flex: 1, backgroundColor: Colors.greyBackground }}>
        {Object.keys(Constants)
          .filter((value) => !IGNORED_CONSTANTS.includes(value))
          .sort()
          .map((key) => {
            if (typeof Constants[key] === 'function') return null;
            return <ExpoConstant name={key} key={key} />;
          })}
        <ExpoConstant name="webViewUserAgent" value={() => Constants.getWebViewUserAgentAsync()} />
      </ScrollView>
    );
  }
}
