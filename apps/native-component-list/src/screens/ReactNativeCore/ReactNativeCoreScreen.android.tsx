import * as React from 'react';
import {
  DrawerLayoutAndroid,
  Image,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScrollView as NavigationScrollView } from 'react-native-gesture-handler';

import { Colors, Layout } from '../../constants';
import ModalExample from '../ModalExample';
import { ActivityIndicatorExample } from './ActivityIndicator';
import { AlertExample } from './Alert';
import { ButtonExample } from './Button';
import { CheckBoxExample } from './CheckBox';
import { ClipboardExample } from './Clipboard';
import { PickerExample } from './Picker';
import { PressableExample } from './Pressable';
import { ProgressBarAndroidExample } from './ProgressBarAndroid';
import { SliderExample } from './Slider';
import { StatusBarExample } from './StatusBar';
import { SwitchExample } from './Switch';
import { TouchableBounceExample } from './TouchableBounce';
import { WebViewExample } from './WebView';

interface State {
  isRefreshing: boolean;
  timeoutId?: any;
}

export default class ReactNativeCoreScreen extends React.Component<{}, State> {
  state: State = {
    isRefreshing: false,
  };

  sections: Array<{ title: string; data: Array<() => JSX.Element> }>;

  constructor(props: any) {
    super(props);

    this.sections = [
      { title: 'CheckBox', data: [() => <CheckBoxExample />] },
      { title: 'Switch', data: [() => <SwitchExample />] },
      { title: 'Button', data: [() => <ButtonExample />] },
      { title: 'ActivityIndicator', data: [() => <ActivityIndicatorExample />] },
      { title: 'Slider', data: [() => <SliderExample />] },
      { title: 'Picker', data: [() => <PickerExample />] },
      { title: 'StatusBar', data: [() => <StatusBarExample />] },
      { title: 'Alert', data: [() => <AlertExample />] },
      { title: 'TouchableBounce', data: [() => <TouchableBounceExample />] },
      { title: 'WebView', data: [() => <WebViewExample />] },
      { title: 'ProgressBarAndroid', data: [() => <ProgressBarAndroidExample />] },
      { title: 'Pressable', data: [() => <PressableExample />] },
      { title: 'Clipboard', data: [() => <ClipboardExample />] },
      { title: 'Vertical ScrollView, RefreshControl', data: [this._renderVerticalScrollView] },
      { title: 'DrawerLayoutAndroid', data: [this._renderDrawerLayout] },
      { title: 'Horizontal ScrollView', data: [this._renderHorizontalScrollView] },
      { title: 'Modal', data: [this._renderModal] },
      { title: 'Text', data: [this._renderText] },
      { title: 'TextInput', data: [this._renderTextInput] },
      { title: 'Touchables', data: [this._renderTouchables] },
    ];
  }

  _onRefresh = () => {
    const timeout = setTimeout(() => {
      this.setState({ isRefreshing: false });
    }, 3000);
    this.setState({ isRefreshing: true, timeoutId: timeout });
  };

  componentWillUnmount() {
    clearTimeout(this.state.timeoutId);
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
        // @ts-ignore
        drawerPosition="left"
        renderNavigationView={renderNavigationView}>
        <SectionList
          removeClippedSubviews={false}
          stickySectionHeadersEnabled
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl refreshing={this.state.isRefreshing} onRefresh={this._onRefresh} />
          }
          contentContainerStyle={{ backgroundColor: '#fff' }}
          renderScrollComponent={props => <NavigationScrollView {...props} />}
          renderItem={this._renderItem}
          renderSectionHeader={this._renderSectionHeader}
          sections={this.sections}
          keyExtractor={(_, index) => `${index}`}
        />
      </DrawerLayoutAndroid>
    );
  }

  _renderItem = ({ item }: any) => {
    return <View>{item()}</View>;
  };

  _renderSectionHeader = ({ section: { title } }: any) => {
    return (
      <View style={styles.sectionHeader}>
        <Text>{title}</Text>
      </View>
    );
  };

  _renderModal = () => {
    return <ModalExample />;
  };

  _renderVerticalScrollView = () => {
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

  _renderText = () => {
    const linkStyle = { color: Colors.tintColor, marginVertical: 3 };

    return (
      <View style={{ padding: 10 }}>
        <Text>
          All text in React Native on Android uses the native text component and supports a bunch of
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
        </View>
      </View>
    );
  };
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
