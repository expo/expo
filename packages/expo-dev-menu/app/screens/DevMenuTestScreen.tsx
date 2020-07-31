import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

import DevMenuContext from '../DevMenuContext';
import { TouchableOpacity } from '../components/Touchables';

export default class DevMenuTestScreen extends React.PureComponent {
  static navigationOptions = {
    headerShown: true,
  };

  static contextType = DevMenuContext;

  pushScreen = () => {
    this.props.navigation.push('Test');
  };

  render() {
    return (
      <View style={styles.container}>
        <View style={{ height: 400, justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity onPress={this.pushScreen}>
            <View
              style={{
                height: 100,
                width: 100,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'green',
              }}>
              <Text style={{ color: 'white' }}>Press me!</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={{ height: 400, backgroundColor: 'blue' }} />
        <View style={{ height: 400, backgroundColor: 'green' }} />
        <View style={{ height: 400, backgroundColor: 'cyan' }} />
        <View style={{ height: 400, backgroundColor: 'yellow' }} />
        <View style={{ height: 400, backgroundColor: 'magenta' }} />
        <View style={{ height: 400, backgroundColor: 'orange' }} />
        <View style={{ height: 400, backgroundColor: 'red' }} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
