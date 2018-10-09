import React from 'react';
import { StyleSheet, Text, View, Switch, Platform } from 'react-native';
import { PaymentsStripe as Stripe } from 'expo-payments-stripe';
import Button from './Button';

function testID(id) {
  return Platform.OS === 'android' ? { accessible: true, accessibilityLabel: id } : { testID: id };
}

export default class ApplePayScreen extends React.Component {
  state = {
    loading: false,
    allowed: false,
    complete: true,
    status: null,
    token: null,
    amexAvailable: false,
    discoverAvailable: false,
    masterCardAvailable: false,
    visaAvailable: false,
  };

  async componentWillMount() {
    await Stripe.setOptionsAsync({
      publishableKey: 'pk_test_M315xbWEvSQjt7B8ZJYzuipC',
      androidPayMode: 'test',
      merchantId: 'merchant.host.exp.exponent',
    });
    const allowed = await Stripe.deviceSupportsApplePayAsync();
    const amexAvailable = await Stripe.canMakeApplePayPaymentsAsync({
      networks: ['american_express'],
    });
    const discoverAvailable = await Stripe.canMakeApplePayPaymentsAsync({
      networks: ['discover'],
    });
    const masterCardAvailable = await Stripe.canMakeApplePayPaymentsAsync({
      networks: ['master_card'],
    });
    const visaAvailable = await Stripe.canMakeApplePayPaymentsAsync({
      networks: ['visa'],
    });
    this.setState({
      allowed,
      amexAvailable,
      discoverAvailable,
      masterCardAvailable,
      visaAvailable,
    });
  }

  handleCompleteChange = complete => this.setState({ complete });

  handleApplePayPress = async () => {
    try {
      this.setState({
        loading: true,
        status: null,
        token: null,
      });
      const token = await Stripe.paymentRequestWithApplePayAsync(
        [
          {
            label: 'Whisky',
            amount: '0.10',
          },
          {
            label: 'Vine',
            amount: '0.30',
          },
          {
            label: 'Tipsi',
            amount: '0.60',
          },
        ],
        {
          //requiredBillingAddressFields: ['all'],
          //requiredShippingAddressFields: ['all'],
          shippingMethods: [
            {
              id: 'fedex',
              label: 'FedEX',
              detail: 'Test @ 10',
              amount: '1.00',
            },
          ],
        }
      );

      this.setState({ loading: false, token });

      if (this.state.complete) {
        await Stripe.completeApplePayRequestAsync();
        this.setState({ status: 'Apple Pay payment completed' });
      } else {
        await Stripe.cancelApplePayRequestAsync();
        this.setState({ status: 'Apple Pay payment cenceled' });
      }
    } catch (error) {
      this.setState({ loading: false, status: `Error: ${error.message}` });
    }
  };

  handleSetupApplePayPress = () => Stripe.openApplePaySetupAsync();

  render() {
    const {
      loading,
      allowed,
      complete,
      status,
      token,
      amexAvailable,
      discoverAvailable,
      masterCardAvailable,
      visaAvailable,
    } = this.state;

    const cards = {
      americanExpressAvailabilityStatus: { name: 'American Express', isAvailable: amexAvailable },
      discoverAvailabilityStatus: { name: 'Discover', isAvailable: discoverAvailable },
      masterCardAvailabilityStatus: { name: 'Master Card', isAvailable: masterCardAvailable },
      visaAvailabilityStatus: { name: 'Visa', isAvailable: visaAvailable },
    };

    return (
      <View style={styles.container}>
        <Text style={styles.header}>Apple Pay Example</Text>
        <Text style={styles.instruction}>Click button to show Apple Pay dialog.</Text>
        <Button
          text="Pay with APay"
          disabledText="Not supported"
          loading={loading}
          disabled={!allowed}
          onPress={this.handleApplePayPress}
          {...testID('applePayButton')}
        />
        <Text style={styles.instruction}>Complete the operation on token</Text>Complete the
        operation on token
        <Switch
          style={styles.switch}
          value={complete}
          onValueChange={this.handleCompleteChange}
          {...testID('applePaySwitch')}
        />
        <View>
          {token && (
            <Text style={styles.instruction} {...testID('applePayToken')}>
              Token: {token.tokenId}
            </Text>
          )}
          {status && (
            <Text style={styles.instruction} {...testID('applePayStatus')}>
              {status}
            </Text>
          )}
        </View>
        <View style={styles.hintContainer}>
          <Button
            text="Setup APay"
            disabledText="Not supported"
            disabled={!allowed}
            onPress={this.handleSetupApplePayPress}
            {...testID('setupApplePayButton')}
          />
          <Text style={styles.hint}>Setup Pay works only on real device</Text>Setup Pay works only
          on real deviceiew style={styles.statusContainer}>
          <Text style={styles.status} {...testID('deviceSupportsApplePayStatus')}>
            Device {allowed ? 'supports' : "doesn't support"} Pay
          </Text>
          {Object.entries(cards).map(([id, { name, isAvailable }]) => (
            <Text style={styles.status} key={id} {...testID(id)}>
              {name} is {isAvailable ? 'available' : 'not available'}
            </Text>
          ))}
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
  switch: {
    marginBottom: 10,
  },
  hintContainer: {
    marginTop: 10,
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
  },
  statusContainer: {
    margin: 20,
    alignSelf: 'stretch',
  },
  status: {
    fontWeight: '300',
    color: 'gray',
  },
});
