import React from 'react';
import { Text, View } from 'react-native';
import { PaymentsStripe as Stripe } from 'expo-payments-stripe';

export default class TokenFromCard extends React.Component {
  state = {
    token: 'unknown1',
  };

  componentWillMount() {
    Stripe.setOptionsAsync({
      publishableKey: 'pk_test_M315xbWEvSQjt7B8ZJYzuipC',
      androidPayMode: 'test',
    });
  }

  componentDidMount() {
    this._loadStripe();
  }

  _loadStripe = async () => {
    let value = 'unknown2';
    try {
      value = await Stripe.createTokenWithCardAsync({
        number: '4242424242424242',
        expMonth: 12,
        expYear: 24,
        cvc: '223',
        name: 'Test User',
        currency: 'usd',
        addressLine1: '123 Test Street',
        addressLine2: 'Apt. 5',
        addressCity: 'Test City',
        addressState: 'Test State',
        addressCountry: 'Test Country',
        addressZip: '55555',
      });
    } catch (e) {
      console.log(e);
    }
    this.setState({ token: value });
  };

  render() {
    return (
      <View style={{ marginTop: 100 }}>
        <Text>{JSON.stringify(this.state.token)}</Text>
      </View>
    );
  }
}
