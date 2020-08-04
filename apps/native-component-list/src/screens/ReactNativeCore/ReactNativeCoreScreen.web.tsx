import * as React from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';

import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import { ActivityIndicatorExample } from './ActivityIndicator';
import { AlertExample } from './Alert';
import { ButtonExample } from './Button';
import { CheckBoxExample } from './CheckBox';
import { ClipboardExample } from './Clipboard';
import { PickerExample } from './Picker';
import { PressableExample } from './Pressable';
import { SliderExample } from './Slider';
import { StatusBarExample } from './StatusBar';
import { SwitchExample } from './Switch';

export default class ReactNativeCoreScreen extends React.Component {
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
          { title: 'CheckBox', data: [() => <CheckBoxExample />] },
          { title: 'Switch', data: [() => <SwitchExample />] },
          { title: 'Button', data: [() => <ButtonExample />] },
          { title: 'ActivityIndicator', data: [() => <ActivityIndicatorExample />] },
          { title: 'Slider', data: [() => <SliderExample />] },
          { title: 'Picker', data: [() => <PickerExample />] },
          { title: 'StatusBar', data: [() => <StatusBarExample />] },
          { title: 'Alert', data: [() => <AlertExample />] },
          { title: 'Pressable', data: [() => <PressableExample />] },
          { title: 'Clipboard', data: [() => <ClipboardExample />] },
          { title: 'Vertical ScrollView, RefreshControl', data: [this._renderRefreshControl] },
          { title: 'Horizontal ScrollView', data: [this._renderHorizontalScrollView] },
          { title: 'Text', data: [this._renderText] },
          { title: 'TextInput', data: [this._renderTextInput] },
          { title: 'Touchables', data: [this._renderTouchables] },
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

  _renderSectionHeader = ({ section }: any) => (
    <View style={styles.sectionHeader}>
      <Text>{section.title}</Text>
    </View>
  );
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
