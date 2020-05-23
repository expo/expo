import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Picker,
  RefreshControl,
  Slider,
  Switch,
  StatusBar,
  SectionList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableHighlight,
  TouchableOpacityProps,
  View,
} from 'react-native';
import WebView from 'react-native-webview';
import { NavigationScreenProps } from 'react-navigation';

import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

export default class ReactNativeCoreScreen extends React.Component<NavigationScreenProps> {
  static path = '';

  static navigationOptions = {
    title: 'React Native Core',
  };

  state = {
    isRefreshing: false,
  };

  _listView?: React.Component;

  render() {
    return (
      <SectionList
        ref={view => (this._listView = view!)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={this.state.isRefreshing} onRefresh={this._onRefresh} />
        }
        keyExtractor={(item, index) => `${index}`}
        removeClippedSubviews={false}
        contentContainerStyle={{ backgroundColor: '#fff' }}
        sections={[
          { title: 'Vertical ScrollView, RefreshControl', data: [this._renderRefreshControl] },
          { title: 'ActivityIndicator', data: [this._renderActivityIndicator] },
          { title: 'Alert', data: [this._renderAlert] },
          { title: 'Horizontal ScrollView', data: [this._renderHorizontalScrollView] },
          { title: 'Picker', data: [this._renderPicker] },
          { title: 'Slider', data: [this._renderSlider] },
          { title: 'StatusBar', data: [this._renderStatusBar] },
          { title: 'Switch', data: [this._renderSwitch] },
          { title: 'Text', data: [this._renderText] },
          { title: 'TextInput', data: [this._renderTextInput] },
          { title: 'Touchables', data: [this._renderTouchables] },
          { title: 'WebView', data: [this._renderWebView] },
        ]}
        renderItem={this._renderItem}
        renderSectionHeader={this._renderSectionHeader}
      />
    );
  }

  _renderItem = ({ item }: { item: () => JSX.Element }) => item();

  _onRefresh = () => {
    this.setState({ isRefreshing: true });
    setTimeout(() => {
      this.setState({ isRefreshing: false });
    }, 3000);
  };

  _scrollToTop = () => {
    // @ts-ignore
    this._listView!.scrollTo({ x: 0, y: 0 });
  };

  _renderRefreshControl = () => (
    <View style={{ padding: 10 }}>
      <Text>
        This screen is a vertical ScrollView, try the pull to refresh gesture to see the
        RefreshControl.
      </Text>
    </View>
  );

  _renderActivityIndicator = () => {
    const Spacer = () => <View style={{ marginRight: 10 }} />;
    return (
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <ActivityIndicator size="small" />
        <Spacer />
        <ActivityIndicator size="large" />
        <Spacer />
        <ActivityIndicator size="small" color={Colors.tintColor} />
        <Spacer />
        <ActivityIndicator size="large" color={Colors.tintColor} />
        <Spacer />
        <ActivityIndicator size="small" animating={false} hidesWhenStopped={false} />
        <Spacer />
        <ActivityIndicator size="large" animating={false} hidesWhenStopped={false} />
      </View>
    );
  };

  _renderAlert = () => {
    const showPrompt = () => {};

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
      <View
        style={{
          flexDirection: Layout.isSmallDevice ? 'column' : 'row',
          padding: 10,
        }}>
        <Button onPress={showPrompt}>Prompt for a value</Button>

        {Layout.isSmallDevice && <View style={{ marginBottom: 10 }} />}

        <Button onPress={showAlert}>Give me some options</Button>
      </View>
    );
  };

  _renderHorizontalScrollView = () => {
    const imageStyle = {
      width: Layout.window.width,
      height: Layout.window.width / 2,
    };

    return (
      <ScrollView pagingEnabled directionalLockEnabled horizontal>
        <Image
          source={require('../../../assets/images/example1.jpg')}
          style={imageStyle}
          resizeMode="cover"
        />
        <Image
          source={require('../../../assets/images/example2.jpg')}
          style={imageStyle}
          resizeMode="cover"
        />
        <Image
          source={require('../../../assets/images/example3.jpg')}
          style={imageStyle}
          resizeMode="cover"
        />
      </ScrollView>
    );
  };

  _renderPicker = () => {
    return <PickerExample />;
  };

  _renderSlider = () => {
    return (
      <View style={{ padding: 10 }}>
        <SliderExample />
      </View>
    );
  };

  _renderStatusBar = () => {
    const randomAnimation = () => {
      return Math.random() > 0.5 ? 'slide' : 'fade';
    };

    const hide = () => {
      StatusBar.setHidden(true, randomAnimation());
    };

    const show = () => {
      StatusBar.setHidden(false, randomAnimation());
    };

    return (
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <Button onPress={hide}>Hide</Button>

        <Button onPress={show}>Show</Button>
      </View>
    );
  };

  _renderSwitch = () => {
    return <SwitchExample />;
  };

  _renderText = () => {
    const linkStyle = { color: Colors.tintColor, marginVertical: 3 };

    return (
      <View style={{ padding: 10 }}>
        <Text>
          All text in React Native on iOS uses the native text component and supports a bunch of
          useful properties.
        </Text>
        <Text style={linkStyle} onPress={() => alert('pressed!')}>
          Press on this!
        </Text>
        <Text numberOfLines={1} ellipsizeMode="tail">
          It's easy to limit the number of lines that some text can span and ellipsize it
        </Text>
      </View>
    );
  };

  _renderTextInput = () => {
    return <TextInputExample />;
  };

  _renderTouchables = () => {
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
      <View style={{ padding: 10, flexDirection: 'row', flex: 1 }}>
        <TouchableHighlight
          underlayColor="rgba(1, 1, 255, 0.9)"
          style={buttonStyle}
          onPress={() => {}}>
          <Text style={buttonText}>Highlight!</Text>
        </TouchableHighlight>

        <TouchableOpacity style={buttonStyle} onPress={() => {}}>
          <Text style={buttonText}>Opacity!</Text>
        </TouchableOpacity>
      </View>
    );
  };

  _renderWebView = () => {
    return (
      <WebView
        style={{ width: Layout.window.width, height: 250 }}
        source={{
          html: `
          <h2>You can always use a WebView if you need to!</h2>
          <p>
            <h4>But don't the other components above seem like better building blocks for most of your UI?</h4>
            <input type="text" placeholder="Disagree? why?"></input>
            <input type="submit">
          </p>
          <p>
            <a href="https://expo.io">expo.io</a>
          </p>
        `,
        }}
      />
    );
  };

  _renderSectionHeader = ({ section }: any) => (
    <View style={styles.sectionHeader}>
      <Text>{section.title}</Text>
    </View>
  );
}

class PickerExample extends React.Component {
  state = {
    language: 'js',
  };

  render() {
    return (
      <Picker
        selectedValue={this.state.language}
        onValueChange={lang => this.setState({ language: lang })}>
        <Picker.Item label="Java" value="java" />
        <Picker.Item label="JavaScript" value="js" />
        <Picker.Item label="Objective C" value="objc" />
        <Picker.Item label="Swift" value="swift" />
      </Picker>
    );
  }
}

interface SliderExampleProps {
  value?: number;
}

interface SliderExampleState {
  value: number;
}

class SliderExample extends React.Component<SliderExampleProps, SliderExampleState> {
  static defaultProps = {
    value: 0,
  };

  constructor(props: SliderExampleProps) {
    super(props);

    this.state = {
      value: props.value!,
    };
  }

  render() {
    const textStyle = {
      color: this.state.value === 0 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.9)',
      marginBottom: -2,
    };

    return (
      <View>
        <Text style={textStyle}>Value: {this.state.value && +this.state.value.toFixed(3)}</Text>
        <Slider {...this.props} onValueChange={value => this.setState({ value })} />
      </View>
    );
  }
}

class SwitchExample extends React.Component {
  state = {
    trueSwitchIsOn: true,
    falseSwitchIsOn: false,
  };

  render() {
    return (
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <Switch
          onValueChange={value => this.setState({ falseSwitchIsOn: value })}
          style={{ marginBottom: 10, marginRight: 10 }}
          value={this.state.falseSwitchIsOn}
        />
        <Switch
          onValueChange={value => this.setState({ trueSwitchIsOn: value })}
          value={this.state.trueSwitchIsOn}
        />
      </View>
    );
  }
}

class TextInputExample extends React.Component {
  state = {
    singleLineValue: '',
    secureTextValue: '',
  };

  render() {
    const textInputStyle = {
      width: Layout.window.width - 20,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: '#eee',
      fontSize: 15,
      padding: 5,
      height: 40,
    };

    const updateSingleLineValue = (value: string) => this.setState({ singleLineValue: value });
    const updateSecureTextValue = (value: string) => this.setState({ secureTextValue: value });

    return (
      <View style={{ padding: 10 }}>
        <TextInput
          placeholder="A single line text input"
          onChangeText={updateSingleLineValue}
          style={[{ marginBottom: 10 }, textInputStyle]}
          value={this.state.singleLineValue}
        />

        <TextInput
          placeholder="A secure text field"
          keyboardAppearance="dark"
          value={this.state.secureTextValue}
          onChangeText={updateSecureTextValue}
          secureTextEntry
          style={textInputStyle}
        />
      </View>
    );
  }
}

const Button: React.FunctionComponent<TouchableOpacityProps> = props => (
  <TouchableOpacity onPress={props.onPress} style={styles.button}>
    <Text style={styles.buttonText}>{props.children}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
  },
  sectionHeader: {
    backgroundColor: 'rgba(245,245,245,1)',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 3,
    backgroundColor: Colors.tintColor,
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
  },
});
