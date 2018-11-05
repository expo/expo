import React from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { Constants } from 'expo';
import Colors from '../constants/Colors';
import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';

const ExpoConstant = ({ name, value }) => {
  if (!value) {
    value = Constants[name];
  }

  const isObject = typeof value === 'object';
  if (isObject) {
    value = JSON.stringify(value, null, 2);
  } else if (typeof value === 'boolean') {
    value = value ? 'true' : 'false';
  }

  return (
    <View style={{ marginBottom: 10 }}>
      <HeadingText>{name}</HeadingText>
      <MonoText>{value}</MonoText>
    </View>
  );
};

export default class ConstantsScreen extends React.Component {
  static navigationOptions = {
    title: 'Constants',
  };

  state = {
    webViewUserAgent: null,
  };

  componentWillMount() {
    this._update();
  }

  _update = async () => {
    let webViewUserAgent = await Constants.getWebViewUserAgentAsync();
    this.setState({ webViewUserAgent });
  };

  render() {
    let webViewUserAgent;
    if (this.state.webViewUserAgent) {
      webViewUserAgent = (
        <ExpoConstant name="webViewUserAgent" value={this.state.webViewUserAgent} />
      );
    }
    return (
      <ScrollView style={{ padding: 10, flex: 1, backgroundColor: Colors.greyBackground }}>
        {Object.keys(Constants).map(key => {
          if (typeof Constants[key] === 'function') return null;
          return <ExpoConstant name={key} key={key} />;
        })}
        {webViewUserAgent}
      </ScrollView>
    );
  }
}

/**
        <ExpoConstant name="expoVersion" />
        <ExpoConstant name="deviceName" />
        <ExpoConstant name="deviceYearClass" />
        <ExpoConstant name="sessionId" />
        <ExpoConstant name="linkingUri" />
        <ExpoConstant name="statusBarHeight" />
        <ExpoConstant name="installationId" />
        <ExpoConstant name="isDevice" />
        <ExpoConstant name="appOwnership" />
        <ExpoConstant name="platform" isObject />
        <ExpoConstant name="manifest" isObject />
*/
