import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';

export default class Home extends React.Component {
  render() {
    return (
      <View style={{ padding: 50 }}>
        <Text style={styles.text} onPress={() => this.props.navigation.navigate('TokenFromCardS')}>
          TokenFromCardScreen
        </Text>
        {Platform.OS === 'android' && (
          <Text style={styles.text} onPress={() => this.props.navigation.navigate('GooglePayS')}>
            GooglePayScreen
          </Text>
        )}
        <Text style={styles.text} onPress={() => this.props.navigation.navigate('CardForm')}>
          CardFormScreen
        </Text>
        <Text style={styles.text} onPress={() => this.props.navigation.navigate('BySource')}>
          BySourceScreen
        </Text>
        {Platform.OS === 'ios' && (
          <Text style={styles.text} onPress={() => this.props.navigation.navigate('ApplePay')}>
            ApplePayScreen
          </Text>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  text: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
    marginTop: 20,
    padding: 5,
    textAlign: 'center',
  },
});
