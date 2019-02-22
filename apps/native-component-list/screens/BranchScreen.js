import React from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { Constants, DangerZone } from 'expo';

let Branch = null;

try {
  Branch = DangerZone.Branch;
} catch (e) {
  // do nothing
}

export default class BranchScreen extends React.Component {
  static navigationOptions = {
    title: 'Branch',
  };

  async _getOrCreateBranchObjectAsync() {
    if (this._branchUniversalObject) {
      return this._branchUniversalObject;
    }

    if (!Branch) {
      throw new Error(
        'Branch native module is not available, are you sure all the native dependencies are linked properly?'
      );
    }

    const branchUniversalObject = await Branch.createBranchUniversalObject(`expo_and_branch`, {
      locallyIndex: false,
      title: 'Expo + Branch example',
      contentImageUrl: 'https://d3lwq5rlu14cro.cloudfront.net/ExponentEmptyManifest_192.png',
      contentDescription: 'Branch is cool!',
      contentMetadata: {
        customMetadata: {
          someCustomData: 'hello',
          otherStuff: 'world',
        },
      },
    });
    branchUniversalObject.logEvent(Branch.BranchEvent.ViewItem);
    this._branchUniversalObject = branchUniversalObject;
    return branchUniversalObject;
  }

  _handleShareSheetAsync = async () => {
    const branchUniversalObject = await this._getOrCreateBranchObjectAsync();
    const { completed, error } = await branchUniversalObject.showShareSheet({}, {});
    if (error) {
      Alert.alert('Oups', 'Something bad happened: ' + error.message);
    } else if (completed) {
      Alert.alert('Share completed!');
    } else {
      Alert.alert('Share canceled');
    }
  };

  render() {
    if (Constants.appOwnership !== 'standalone') {
      return (
        <View style={styles.container}>
          <Text style={styles.oopsTitle}>Hello, developer person!</Text>
          <Text style={styles.oopsText}>
            Branch only works for standalone apps. If you want to use this example you can build it
            build native-component-list as a standalone app.
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <Button title="Open share sheet" onPress={this._handleShareSheetAsync} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginVertical: 15,
    marginHorizontal: 10,
  },
  faintText: {
    color: '#888',
    marginHorizontal: 30,
  },
  oopsTitle: {
    fontSize: 25,
    marginBottom: 5,
    textAlign: 'center',
  },
  oopsText: {
    textAlign: 'center',
    marginTop: 10,
    marginHorizontal: 30,
  },
});
