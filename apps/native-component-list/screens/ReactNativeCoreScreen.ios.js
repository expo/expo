import React from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  AlertIOS,
  DatePickerIOS,
  Image,
  Picker,
  ProgressViewIOS,
  RefreshControl,
  SegmentedControlIOS,
  Slider,
  Switch,
  StatusBar,
  ListView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableHighlight,
  View,
  WebView,
} from 'react-native';
import TouchableBounce from 'react-native/Libraries/Components/Touchable/TouchableBounce';

import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
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

  componentDidMount() {
    let dataSource = this.state.dataSource.cloneWithRowsAndSections({
      'Vertical ScrollView, RefreshControl': [this._renderRefreshControl],
      ActionSheetIOS: [this._renderActionSheet],
      ActivityIndicator: [this._renderActivityIndicator],
      Alert: [this._renderAlert],
      DatePickerIOS: [this._renderDatePicker],
      'Horizontal ScrollView': [this._renderHorizontalScrollView],
      MaskView: [this._renderMaskView],
      Modal: [this._renderModal],
      Picker: [this._renderPicker],
      ProgressView: [this._renderProgressView],
      SegmentedControl: [this._renderSegmentedControl],
      Slider: [this._renderSlider],
      StatusBar: [this._renderStatusBar],
      Switch: [this._renderSwitch],
      Text: [this._renderText],
      TextInput: [this._renderTextInput],
      Touchables: [this._renderTouchables],
      // 'View': [this._renderView],
      WebView: [this._renderWebView],
    });

    this.setState({ dataSource });
  }

  render() {
    return (
      <ListView
        ref={view => {
          this._listView = view;
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={this.state.isRefreshing} onRefresh={this._onRefresh} />
        }
        removeClippedSubviews={false}
        contentContainerStyle={{ backgroundColor: '#fff' }}
        dataSource={this.state.dataSource}
        renderRow={this._renderRow}
        renderSectionHeader={this._renderSectionHeader}
      />
    );
  }

  _onRefresh = () => {
    this.setState({ isRefreshing: true });
    setTimeout(() => {
      this.setState({ isRefreshing: false });
    }, 3000);
  };

  _scrollToTop = () => {
    this._listView.scrollTo({ x: 0, y: 0 });
  };

  _renderMaskView = () => {
    return (
      <View style={{ padding: 10, flexDirection: 'row' }}>
        <Button onPress={() => this.props.navigation.navigate('BasicMaskExample')}>
          Basic Mask
        </Button>
        <Button onPress={() => this.props.navigation.navigate('GLMaskExample')}>
          Mask on top of GL
        </Button>
      </View>
    );
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

  _renderActionSheet = () => {
    const showActionSheet = () => {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Option 0', 'Option 1', 'Delete', 'Cancel'],
          cancelButtonIndex: 3,
          destructiveButtonIndex: 2,
        },
        buttonIndex => {
          console.log({ buttonIndex });
        }
      );
    };

    const showShareSheet = () => {
      ActionSheetIOS.showShareActionSheetWithOptions(
        {
          url: 'https://expo.io',
          message: 'message to go with the shared url',
          subject: 'a subject to go in the email heading',
        },
        error => alert(error),
        (success, method) => {
          if (success) {
            alert(`Shared via ${method}`);
          }
        }
      );
    };

    return (
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <Button onPress={showActionSheet}>Action sheet</Button>

        <Button onPress={showShareSheet}>Share sheet</Button>
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
    const showPrompt = () => {
      AlertIOS.prompt('Enter a value', null, text => console.log(`You entered ${text}`));
    };

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

  _renderDatePicker = () => {
    return <DatePickerExample />;
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

  _renderProgressView = () => {
    return (
      <View style={{ padding: 10, paddingBottom: 30 }}>
        <ProgressViewExample initialProgress={0} />
        <ProgressViewExample progressTintColor="red" initialProgress={0.4} />
        <ProgressViewExample progressTintColor="orange" initialProgress={0.6} />
        <ProgressViewExample progressTintColor="yellow" initialProgress={0.8} />
      </View>
    );
  };

  _renderSegmentedControl = () => {
    return <SegmentedControlExample />;
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

        <TouchableBounce style={buttonStyle} onPress={() => {}}>
          <Text style={buttonText}>Bounce!</Text>
        </TouchableBounce>
      </View>
    );
  };

  // _renderView = () => {
  //   // Don't know what to put here
  //   return (
  //     <View>
  //     </View>
  //   );
  // }

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
      <DatePickerIOS
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
        st
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

class ProgressViewExample extends React.Component {
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
    // setTimeout(() => {
    //   this.setState({
    //     progress: this.state.progress === 1
    //       ? 0
    //       : Math.min(1, this.state.progress + 0.01),
    //   });
    //   this.progressLoop();
    // }, 17 * 2);
  }

  render() {
    const progressStyle = { marginTop: 20 };

    return (
      <ProgressViewIOS
        style={progressStyle}
        progressTintColor={this.props.progressTintColor}
        progress={this.state.progress}
      />
    );
  }
}

class SegmentedControlExample extends React.Component {
  state = {
    selectedIndex: 0,
  };

  render() {
    let tintColor;
    switch (this.state.selectedIndex) {
      case 0:
        tintColor = 'black';
        break;
      case 1:
        tintColor = Colors.tintColor;
        break;
      case 2:
        tintColor = 'green';
        break;
      case 3:
        tintColor = 'purple';
        break;
    }

    return (
      <View style={{ margin: 10 }}>
        <SegmentedControlIOS
          values={['One', 'Two', 'Three', 'Four']}
          tintColor={tintColor}
          selectedIndex={this.state.selectedIndex}
          onChange={event => {
            this.setState({
              selectedIndex: event.nativeEvent.selectedSegmentIndex,
            });
          }}
        />
      </View>
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
