import { PaymentsStripe as Payments } from 'expo-payments-stripe';
import { AndroidToken, AppleToken } from 'expo-payments-stripe/build/utils/types';

import * as React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useResolvedValue } from '../utilities/useResolvedValue';

import Button from '../components/Button';

Payments.setOptionsAsync({
  publishableKey: 'pk_test_u0d2z2Q308KUGR02U7A3JjIs00RYjHOfRB',
});

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
    color: 'gray',
  },
});

type State = {
  isComplete: boolean;
  isLoading: boolean;
  status: null | string;
  token: null | AndroidToken | AppleToken;
};
const initialState: State = {
  isComplete: true,
  isLoading: true,
  status: null,
  token: null,
};

export default function PaymentsScreen() {
  const [isAvailable, error] = useResolvedValue(Payments.deviceSupportsNativePayAsync);

  React.useEffect(() => {
    error && alert(error);
  }, [error]);
  const [state, setState] = React.useReducer(
    (state: State, action: Partial<State>) => ({ ...state, ...action }),
    initialState
  );

  const handleCompleteChange = (isComplete: boolean) => setState({ isComplete });

  const handleApplePayPress = async () => {
    try {
      setState({
        isLoading: true,
        status: null,
        token: null,
      });
      const token = await Payments.paymentRequestWithNativePayAsync(
        {
          /**
           * A bit field of billing address fields that you need in order to process the transaction.
           * Array either should contain at least one valid value or should not be specified to disable.
           */
          requiredBillingAddressFields: ['all'],
          /**
           * A bit field of shipping address fields that you need in order to process the transaction.
           * Array either should contain at least one valid value or should not be specified to disable.
           */
          requiredShippingAddressFields: ['all'],
          // /**
          //  * An array of `ShippingMethod` objects that describe the supported shipping methods.
          //  */
          shippingMethods: [
            {
              id: 'fedex',
              label: 'FedEX',
              detail: 'Test @ 10',
              amount: '10.00',
            },
          ],
          // /**
          //  * The three-letter ISO 4217 currency code. Default is USD.
          //  */
          // currencyCode?: string;
          // /**
          //  * The two-letter code for the country where the payment will be processed. Default is US.
          //  */
          // countryCode?: string;
          // /**
          //  * An optional value that indicates how purchased items are to be shipped. Default is shipping.
          //  */
          // shippingType?: ShippingType;
        },
        [
          {
            label: 'Item 1',
            amount: '200.00',
          },
          {
            label: 'Item 2',
            amount: '60.00',
          },
          {
            label: 'Expo, Inc',
            amount: '260.00',
          },
        ]
      );

      console.log('Result:', token);
      setState({ isLoading: false, token });

      if (state.isComplete) {
        await Payments.completeNativePayRequestAsync();
        console.log('Apple Pay payment completed');
        setState({ status: 'Apple Pay payment completed' });
      } else {
        await Payments.cancelNativePayRequestAsync();
        console.log('Apple Pay payment cancelled');
        setState({ status: 'Apple Pay payment cenceled' });
      }
    } catch (error) {
      console.log('Error:', error);
      setState({ isLoading: false, status: `Error: ${error.message}` });
    }
  };

  const { isLoading, isComplete, status, token } = state;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Apple Pay Example with Expo</Text>
      <Text style={styles.instruction}>Click button to show Apple Pay dialog.</Text>
      <Button
        title={isAvailable ? 'Pay with Pay' : 'Native pay not supported'}
        disabled={!isAvailable}
        onPress={handleApplePayPress}
      />
      <Text style={styles.instruction}>Complete the operation on token</Text>
      <Switch style={styles.switch} value={isComplete} onValueChange={handleCompleteChange} />
      <View>
        {token && <Text style={styles.instruction}>Token: {token.tokenId}</Text>}
        {status && <Text style={styles.instruction}>{status}</Text>}
      </View>
      <View style={styles.hintContainer}>
        <Button
          title={isAvailable ? 'Setup Pay' : 'Cannot setup native pay'}
          disabled={!isAvailable}
          onPress={() => Payments.openNativePaySetupAsync()}
        />
        <Text style={styles.hint}>('Setup Pay' works only on real device)</Text>
      </View>
    </View>
  );
}
