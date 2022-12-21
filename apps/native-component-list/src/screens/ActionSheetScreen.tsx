import { ActionSheetProvider, connectActionSheet } from '@expo/react-native-action-sheet';
import React from 'react';
import {
  ActionSheetIOS,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';

import ShowActionSheetButton from '../components/ShowActionSheetButton';
import { Colors } from '../constants';

const Button: React.FunctionComponent<TouchableOpacityProps> = (props) => {
  return (
    <TouchableOpacity
      onPress={props.onPress}
      style={{
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 3,
        backgroundColor: Colors.tintColor,
        marginRight: 10,
      }}>
      <Text
        style={{
          color: '#fff',
        }}>
        {props.children}
      </Text>
    </TouchableOpacity>
  );
};

const ActionSheetProviderScreen = () => (
  <ActionSheetProvider>
    <App />
  </ActionSheetProvider>
);

function ActionSheetScreen() {
  return (
    <ScrollView>
      <ActionSheetProviderScreen />
      {Platform.OS === 'ios' && <ActionSheetIOSExample />}
    </ScrollView>
  );
}

function ActionSheetIOSExample() {
  const showActionSheet = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Option 0', 'Option 1', 'Delete', 'Cancel'],
        cancelButtonIndex: 3,
        destructiveButtonIndex: 2,
      },
      (buttonIndex) => {
        console.log({ buttonIndex });
      }
    );
  };

  const showShareSheet = () => {
    ActionSheetIOS.showShareActionSheetWithOptions(
      {
        url: 'https://expo.dev',
        message: 'message to go with the shared url',
        subject: 'a subject to go in the email heading',
      },
      (error) => alert(error),
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
}

ActionSheetScreen.navigationOptions = {
  title: 'Action Sheet',
};

export default ActionSheetScreen;

interface State {
  selectedIndex?: number;
}

// @ts-ignore
@connectActionSheet
class App extends React.Component<{ showActionSheetWithOptions?: any }, State> {
  readonly state: State = {};

  _updateSelectionText = (selectedIndex: number) => {
    this.setState({ selectedIndex });
  };

  _renderSelectionText() {
    const { selectedIndex } = this.state;
    const text =
      selectedIndex === undefined ? 'No Option Selected' : `Option #${selectedIndex + 1} Selected`;

    return <Text style={styles.selectionText}>{text}</Text>;
  }

  _renderSectionHeader(text: string) {
    return <Text style={styles.sectionHeaderText}>{text}</Text>;
  }

  _renderButtons() {
    const { showActionSheetWithOptions } = this.props;
    return (
      <View style={{ alignItems: 'center' }}>
        {this._renderSectionHeader('Universal Options')}
        <ShowActionSheetButton
          title="Options Only"
          onSelection={this._updateSelectionText}
          showActionSheetWithOptions={showActionSheetWithOptions}
        />
        <ShowActionSheetButton
          title="Title"
          withTitle
          onSelection={this._updateSelectionText}
          showActionSheetWithOptions={showActionSheetWithOptions}
        />
        <ShowActionSheetButton
          title="Title & Message"
          withTitle
          withMessage
          onSelection={this._updateSelectionText}
          showActionSheetWithOptions={showActionSheetWithOptions}
        />
        {this._renderSectionHeader('Android-Only Options')}
        <ShowActionSheetButton
          title="Icons"
          withIcons
          onSelection={this._updateSelectionText}
          showActionSheetWithOptions={showActionSheetWithOptions}
        />
        <ShowActionSheetButton
          title="Title, Message, & Icons"
          withTitle
          withMessage
          withIcons
          onSelection={this._updateSelectionText}
          showActionSheetWithOptions={showActionSheetWithOptions}
        />
        <ShowActionSheetButton
          title="Use Separators"
          withTitle
          withIcons
          withSeparators
          onSelection={this._updateSelectionText}
          showActionSheetWithOptions={showActionSheetWithOptions}
        />
        <ShowActionSheetButton
          title="Custom Styles"
          withTitle
          withMessage
          withIcons
          withCustomStyles
          onSelection={this._updateSelectionText}
          showActionSheetWithOptions={showActionSheetWithOptions}
        />
      </View>
    );
  }

  render() {
    return (
      <ScrollView style={styles.flex} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.headerText}>
          {'Hello!\n\nThis is a simple example app to demonstrate @expo/react-native-action-sheet.'}
        </Text>
        {this._renderButtons()}
        {this._renderSelectionText()}
        <Text style={styles.notes}>
          Note: Icons and custom text styles are only available on Android and web. Separators can
          only be toggled on Android or web; they always show on iOS.
        </Text>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingVertical: 20,
  },
  headerText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 10,
  },
  notes: {
    marginTop: 32,
  },
  sectionHeaderText: {
    color: 'orange',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  selectionText: {
    textAlign: 'center',
    color: 'blue',
    fontSize: 16,
    marginTop: 20,
  },
});
