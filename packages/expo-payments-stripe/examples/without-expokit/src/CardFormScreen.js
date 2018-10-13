import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { PaymentsStripe as Stripe } from 'expo-payments-stripe';
import Button from './Button';

function testID(id) {
  return Platform.OS === 'android' ? { accessible: true, accessibilityLabel: id } : { testID: id };
}

export default class CardFormScreen extends React.Component {
  state = {
    token: 'bbb',
    loading: false,
  };

  componentWillMount() {
    Stripe.setOptionsAsync({
      publishableKey: 'pk_test_M315xbWEvSQjt7B8ZJYzuipC',
      androidPayMode: 'test',
    });
  }

  handleCardPayPress = async () => {
    try {
      this.setState({ loading: true, token: null });
      const token = await Stripe.paymentRequestWithCardFormAsync({
        // Only iOS support this options
        smsAutofillDisabled: true,
        requiredBillingAddressFields: 'full',
        prefilledInformation: {
          billingAddress: {
            name: 'Gunilla Haugeh',
            line1: 'Canary Place',
            line2: '3',
            city: 'Macon',
            state: 'Georgia',
            country: 'US',
            postalCode: '31217',
            email: 'ghaugeh0@printfriendly.com',
          },
        },
      });

      this.setState({ loading: false, token });
    } catch (error) {
      this.setState({ loading: false });
    }
  };

  render() {
    const { loading, token } = this.state;

    return (
      <View style={styles.container}>
        <Text style={styles.header}>Card Form Example</Text>
        <Text style={styles.instruction}>Click button to show Card Form dialog.</Text>
        <Button
          text="Enter your card and pay"
          loading={loading}
          onPress={this.handleCardPayPress}
          {...testID('cardFormButton')}
        />
        <View style={styles.token} {...testID('cardFormToken')}>
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
