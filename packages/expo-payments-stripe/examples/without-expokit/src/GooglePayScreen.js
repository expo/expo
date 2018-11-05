import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { PaymentsStripe as Stripe } from 'expo-payments-stripe';

export default class GooglePayScreen extends React.Component {
  state = {
    loading: false,
    allowed: false,
    token: null,
  };

  async componentWillMount() {
    await Stripe.setOptionsAsync({
      publishableKey: 'pk_test_M315xbWEvSQjt7B8ZJYzuipC',
      androidPayMode: 'test',
    });
    let allowed = false;
    try {
      allowed = await Stripe.deviceSupportsAndroidPayAsync();
    } catch (e) {
      console.log(e);
    }
    console.log(allowed);
    this.setState({ allowed });
  }

  handleAndroidPayPress = async () => {
    try {
      this.setState({
        loading: true,
        token: null,
      });
      let token = 'unknown';
      try {
        token = await Stripe.paymentRequestWithAndroidPayAsync({
          total_price: '6',
          currency_code: 'USD',
          shipping_address_required: false,
          shipping_countries: ['US', 'CA'],
          line_items: [
            {
              currency_code: 'USD',
              description: 'Whisky',
              total_price: '1',
              unit_price: '1',
              quantity: '1',
            },
            {
              currency_code: 'USD',
              description: 'Vine',
              total_price: '2',
              unit_price: '2',
              quantity: '1',
            },
            {
              currency_code: 'USD',
              description: 'Tipsi',
              total_price: '3',
              unit_price: '3',
              quantity: '1',
            },
          ],
        });
      } catch (e) {
        console.log(e);
      }
      this.setState({ loading: false, token });
    } catch (error) {
      this.setState({ loading: false });
    }
  };

  render() {
    const { loading, allowed, token } = this.state;
    return (
      <View style={styles.container}>
        <Text style={styles.instruction}>Click button to show Android Pay dialog.</Text>
        <Button
          title="Pay with Android Pay"
          disabledText="Not supported"
          loading={loading}
          disabled={!allowed}
          onPress={this.handleAndroidPayPress}
        />
        <View style={styles.token}>
          {token && <Text style={styles.instruction}>Token: {token.tokenId}</Text>}
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
  token: {
    height: 20,
  },
});
