import React from 'react';
import { ScrollView, View } from 'react-native';
import { Constants } from 'expo';
import Colors from '../constants/Colors';
import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';

class ExpoConstant extends React.Component {
  state = {
    value: null,
    error: null,
  };

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
    let { value, error } = this.state;
    const { name } = this.props;

    if (value == null || typeof value === 'function') {
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

export default class ConstantsScreen extends React.Component {
  static navigationOptions = {
    title: 'Constants',
  };

  render() {
    return (
      <ScrollView style={{ padding: 10, flex: 1, backgroundColor: Colors.greyBackground }}>
        {Object.keys(Constants)
          .sort()
          .map(key => {
            if (typeof Constants[key] === 'function') return null;
            return <ExpoConstant name={key} key={key} />;
          })}
        <ExpoConstant name="webViewUserAgent" value={() => Constants.getWebViewUserAgentAsync()} />
      </ScrollView>
    );
  }
}
