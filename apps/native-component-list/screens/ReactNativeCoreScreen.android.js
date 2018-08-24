import React from 'react';

import {
  ActivityIndicator,
  Alert,
  DatePickerAndroid,
  DrawerLayoutAndroid,
  Image,
  Picker,
  ProgressBarAndroid,
  RefreshControl,
  Slider,
  Switch,
  StatusBar,
  ListView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TimePickerAndroid,
  TouchableOpacity,
  TouchableHighlight,
  TouchableNativeFeedback,
  View,
  WebView,
} from 'react-native';
import TouchableBounce from 'react-native/Libraries/Components/Touchable/TouchableBounce';

import { Colors, Layout } from '../constants';
import ModalExample from './ModalExample';

export default class ReactNativeCoreScreen extends React.Component {
  static navigationOptions = {
    title: 'React Native Core',
  };

  state = {
    isRefreshing: false,
    dataSource: new ListView.DataSource({
      rowHasChanged: () => false,
      sectionHeaderHasChanged: () => false,
    }),
  };

  onRefresh = () => {
    this.setState({ isRefreshing: true });
    setTimeout(() => {
      this.setState({ isRefreshing: false });
    }, 3000);
  };

  componentWillUnmount() {
    this._tabPressedListener.remove();
  }

  componentDidMount() {
    let dataSource = this.state.dataSource.cloneWithRowsAndSections({
      'Vertical ScrollView, RefreshControl': [this._renderRefreshControl],
      DrawerLayoutAndroid: [this._renderDrawerLayout],
      ActivityIndicator: [this._renderActivityIndicator],
      Alert: [this._renderAlert],
      DatePickerAndroid: [this._renderDatePicker],
      TimerPickerAndroid: [this._renderTimePicker],
      'Horizontal ScrollView': [this._renderHorizontalScrollView],
      Modal: [this._renderModal],
      Picker: [this._renderPicker],
      ProgressBar: [this._renderProgressBar],
      Slider: [this._renderSlider],
      StatusBar: [this._renderStatusBar],
      Switch: [this._renderSwitch],
      Text: [this._renderText],
      TextInput: [this._renderTextInput],
      Touchables: [this._renderTouchables],
      WebView: [this._renderWebView],
    });

    this.setState({ dataSource });
  }

  render() {
    const renderNavigationView = () => (
      <View
        style={{
          flex: 1,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text>DrawerLayoutAndroid</Text>
      </View>
    );

    return (
      <DrawerLayoutAndroid
        drawerWidth={300}
        drawerPosition={DrawerLayoutAndroid.positions.Left}
        renderNavigationView={renderNavigationView}>
        <ListView
          ref={view => {
            this._listView = view;
          }}
          removeClippedSubviews={false}
          stickySectionHeadersEnabled
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl refreshing={this.state.isRefreshing} onRefresh={this._onRefresh} />
          }
          contentContainerStyle={{ backgroundColor: '#fff' }}
          dataSource={this.state.dataSource}
          renderRow={this._renderRow}
          renderSectionHeader={this._renderSectionHeader}
        />
      </DrawerLayoutAndroid>
    );
  }

  _scrollToTop = () => {
    this._listView.scrollTo({ x: 0, y: 0 });
  };

  _renderModal = () => {
    return <ModalExample />;
  };

  _renderRefreshControl = () => {
    return (
      <View style={{ padding: 10 }}>
        <Text>
          This screen is a vertical ScrollView, try the pull to refresh gesture to see the
          RefreshControl.
        </Text>
      </View>
    );
  };

  _renderDrawerLayout = () => {
    return (
      <View style={{ padding: 10 }}>
        <Text>Swipe from the left of the screen to see the drawer.</Text>
      </View>
    );
  };

  _renderActivityIndicator = () => {
    const Spacer = () => <View style={{ marginRight: 10 }} />;
    return (
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <ActivityIndicator size="small" />
        <Spacer />
        <ActivityIndicator size="large" />
        <Spacer />
        <ActivityIndicator size="small" color="#888" />
        <Spacer />
        <ActivityIndicator size="large" color="#888" />
      </View>
    );
  };

  _renderAlert = () => {
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
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <Button onPress={showAlert}>Give me some options</Button>
      </View>
    );
  };

  _renderDatePicker = () => {
    const showDatePicker = async () => {
      try {
        const { action } = await DatePickerAndroid.open({
          // Use `new Date()` for current date.
          // May 25 2020. Month 0 is January.
          date: new Date(2020, 4, 25),
        });
        if (action !== DatePickerAndroid.dismissedAction) {
          // Selected year, month (0-11), day
        }
      } catch ({ code, message }) {
        console.warn('Cannot open date picker', message);
      }
    };

    return (
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <Button onPress={showDatePicker}>Show date picker</Button>
      </View>
    );
  };

  _renderTimePicker = () => {
    const showTimePicker = async () => {
      try {
        const { action } = await TimePickerAndroid.open({
          hour: 14,
          minute: 0,
          is24Hour: false, // Will display '2 PM'
        });
        if (action !== TimePickerAndroid.dismissedAction) {
          // Selected hour (0-23), minute (0-59)
        }
      } catch ({ code, message }) {
        console.warn('Cannot open time picker', message);
      }
    };

    return (
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <Button onPress={showTimePicker}>Show time picker</Button>
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
          source={require('../assets/images/example1.jpg')}
          style={imageStyle}
          resizeMode="cover"
        />
        <Image
          source={require('../assets/images/example2.jpg')}
          style={imageStyle}
          resizeMode="cover"
        />
        <Image
          source={require('../assets/images/example3.jpg')}
          style={imageStyle}
          resizeMode="cover"
        />
      </ScrollView>
    );
  };

  _renderPicker = () => {
    return <PickerExample />;
  };

  _renderProgressBar = () => {
    return (
      <View style={{ padding: 10, paddingBottom: 30 }}>
        <ProgressBarExample initialProgress={0} />
        <ProgressBarExample progressTintColor="red" initialProgress={0.4} />
        <ProgressBarExample progressTintColor="orange" initialProgress={0.6} />
        <ProgressBarExample progressTintColor="yellow" initialProgress={0.8} />
      </View>
    );
  };

  _renderSlider = () => {
    return <SliderExample />;
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
      paddingHorizontal: 20,
      paddingVertical: 15,
      marginRight: 10,
      backgroundColor: Colors.tintColor,
      borderRadius: 5,
    };

    const buttonText = {
      color: '#fff',
    };

    return (
      <View style={{ flex: 1 }}>
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

        <View style={{ padding: 10, flexDirection: 'row', flex: 1 }}>
          <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple('#fff', false)}
            onPress={() => {}}
            delayPressIn={0}>
            <View style={buttonStyle}>
              <Text style={buttonText}>Native feedback!</Text>
            </View>
          </TouchableNativeFeedback>

          <TouchableBounce style={buttonStyle} onPress={() => {}}>
            <Text style={buttonText}>Bounce!</Text>
          </TouchableBounce>
        </View>
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

  _renderRow = renderRowFn => {
    return <View>{renderRowFn && renderRowFn()}</View>;
  };

  _renderSectionHeader = (_, sectionTitle) => {
    return (
      <View style={styles.sectionHeader}>
        <Text>{sectionTitle}</Text>
      </View>
    );
  };
}

class DatePickerExample extends React.Component {
  state = {
    date: new Date(),
    timeZoneOffsetInHours: -1 * new Date().getTimezoneOffset() / 60,
  };

  render() {
    return (
      <DatePickerAndroid
        date={this.state.date}
        mode="datetime"
        timeZoneOffsetInMinutes={this.state.timeZoneOffsetInHours * 60}
        onDateChange={this._onDateChange}
      />
    );
  }

  _onDateChange = date => {
    this.setState({ date });
  };
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

class ProgressBarExample extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      progress: props.initialProgress,
    };
  }

  componentDidMount() {
    this.progressLoop();
  }

  progressLoop() {
    setTimeout(() => {
      this.setState({
        progress: this.state.progress === 1 ? 0 : Math.min(1, this.state.progress + 0.01),
      });

      this.progressLoop();
    }, 17 * 2);
  }

  render() {
    const progressStyle = { marginTop: 20 };

    return (
      <ProgressBarAndroid
        styleAttr="Horizontal"
        style={progressStyle}
        color={this.props.progressTintColor}
        progress={this.state.progress}
      />
    );
  }
}

class SliderExample extends React.Component {
  static defaultProps = {
    value: 0,
  };

  constructor(props) {
    super(props);

    this.state = {
      value: props.value,
    };
  }

  render() {
    const textStyle = {
      color: this.state.value === 0 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.9)',
      marginBottom: -2,
    };

    return (
      <View>
        <View style={{ padding: 10 }}>
          <Text style={textStyle}>Value: {this.state.value && +this.state.value.toFixed(3)}</Text>
        </View>

        <Slider {...this.props} onValueChange={value => this.setState({ value })} />

        <View style={{ marginBottom: 10 }} />
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
          style={{ marginRight: 10 }}
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
    let textInputStyle = {
      width: Layout.window.width - 20,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: '#eee',
      fontSize: 15,
      padding: 5,
      height: 40,
    };

    const updateSingleLineValue = value => this.setState({ singleLineValue: value });
    const updateSecureTextValue = value => this.setState({ secureTextValue: value });

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

function Button(props) {
  return (
    <TouchableOpacity onPress={props.onPress} style={styles.button}>
      <Text style={styles.buttonText}>{props.children}</Text>
    </TouchableOpacity>
  );
}

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
