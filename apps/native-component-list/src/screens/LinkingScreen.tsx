import React from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Linking } from 'expo';

import Button from '../components/Button';
import MonoText from '../components/MonoText';
import Colors from '../constants/Colors';

class TextInputButton extends React.Component<
  { text: string },
  { text: string; parsed: string; canOpen: boolean }
> {
  constructor(props: { text: string }) {
    super(props);

    this.state = {
      text: props.text,
      parsed: '',
      canOpen: false,
    };
  }

  componentDidMount() {
    this.onChangeText(this.props.text);
  }

  onChangeText = async (text: string) => {
    let parsedTextResult = '';
    const canOpenURL = await Linking.canOpenURL(text);
    if (canOpenURL) {
      const parsedText = await Linking.parse(text);
      parsedTextResult = JSON.stringify(parsedText, null, 2);
    }

    this.setState({ text, parsed: parsedTextResult, canOpen: canOpenURL });
  }

  handleClick = async () => {
    const { text } = this.state;
    try {
      const supported = await Linking.canOpenURL(text);

      if (supported) {
        Linking.openURL(text);
      } else {
        const message = `Don't know how to open URI: ${text}`;
        console.log(message);
        alert(message);
      }
    } catch ({ message }) {
      console.error(message);
    }
  }

  render() {
    const { text, parsed, canOpen } = this.state;

    const buttonTitle = canOpen ? 'Open 😁' : 'Cannot Open 😕';
    return (
      <View>
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            onChangeText={this.onChangeText}
            value={text}
          />
          <Button
            title={buttonTitle}
            onPress={this.handleClick}
            disabled={!canOpen}
          />
        </View>
        <MonoText containerStyle={styles.itemText}>{parsed}</MonoText>
      </View>
    );
  }
}

interface State {
  initialUrl?: string;
}

export default class LinkingScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'Linking',
  };

  readonly state: State = {};

  componentDidMount() {
    this.setupAsync();
    Linking.addEventListener('url', this.onEvent);
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this.onEvent);
  }

  onEvent = ({ url }: any) => {
    alert(`Linking url event: ${url}`);
  }

  setupAsync = async () => {
    const initialUrl = await Linking.getInitialURL();
    this.setState({ initialUrl });
  }

  render() {
    return (
      <ScrollView style={styles.container}>
        {this.state.initialUrl && (
          <TextInputButton text={this.state.initialUrl} />
        )}
        <TextInputButton text="https://github.com/search?q=Expo" />
        <TextInputButton text="https://www.expo.io" />
        <TextInputButton text="http://www.expo.io" />
        <TextInputButton text="http://expo.io" />
        <TextInputButton text="fb://notifications" />
        <TextInputButton text="geo:37.484847,-122.148386" />
        <TextInputButton text="tel:9876543210" />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
  textInputContainer: {
    flexDirection: 'row',
    maxWidth: '100%',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  textInput: {
    height: 40,
    flex: 1,
    borderColor: Colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  itemText: {
    borderWidth: 0,
    flex: 1,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 18,
    paddingLeft: 12,
  },
});
