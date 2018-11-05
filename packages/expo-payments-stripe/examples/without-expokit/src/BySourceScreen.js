import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { PaymentsStripe as Stripe } from 'expo-payments-stripe';
import Button from './Button';

function testID(id) {
  return Platform.OS === 'android' ? { accessible: true, accessibilityLabel: id } : { testID: id };
}

export default class BySourceScreen extends React.Component {
  state = {
    loading: false,
    source: null,
  };

  componentWillMount() {
    Stripe.setOptionsAsync({
      publishableKey: 'pk_test_M315xbWEvSQjt7B8ZJYzuipC',
      androidPayMode: 'test',
    });
  }

  handleCreateSourcePress = async () => {
    try {
      this.setState({ loading: true, source: null });

      const source = await Stripe.createSourceWithParamsAsync({
        type: 'alipay',
        amount: 50,
        currency: 'EUR',
        returnURL: 'expaymentsstripe://stripe-redirect',
      });
      this.setState({ loading: false, source });
    } catch (error) {
      this.setState({ loading: false });
    }
  };

  render() {
    const { loading, source } = this.state;

    return (
      <View style={styles.container}>
        <Text style={styles.header}>Source Example</Text>
        <Text style={styles.instruction}>Click button to create a source.</Text>
        <Button
          text="Create source for Alipay payment"
          loading={loading}
          onPress={this.handleCreateSourcePress}
          {...testID('sourceButton')}
        />
        <View style={styles.source} {...testID('sourceObject')}>
          {source && <Text style={styles.instruction}>Source: {JSON.stringify(source)}</Text>}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instruction: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  source: {
    width: '100%',
    height: 120,
  },
});
