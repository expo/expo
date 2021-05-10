import { PaymentsStripe as Payments } from 'expo-payments-stripe';
import { AndroidToken, AppleToken } from 'expo-payments-stripe/build/utils/types';
import * as React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import Button from '../components/Button';
import { useResolvedValue } from '../utilities/useResolvedValue';

Payments.setOptionsAsync({
  publishableKey: 'pk_test_u0d2z2Q308KUGR02U7A3JjIs00RYjHOfRB',
  merchantId: 'merchant.com.example.development',
  androidPayMode: 'test',
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
  const [isAvailable] = useResolvedValue(Payments.deviceSupportsNativePayAsync);

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
          /**
           * An array of `ShippingMethod` objects that describe the supported shipping methods.
           */
          shippingMethods: [
            {
              id: 'zebra',
              label: 'An actual Zebra 🦓',
              detail: 'A real zebra will bring you the package 😳',
              amount: '250.00',
            },
            {
              id: 'fedex',
              label: 'FedEX',
              detail: 'Test @ 10',
              amount: '10.00',
            },
          ],
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

  const { isComplete, status, token } = state;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Miscellaneous methods</Text>
      <Text style={styles.instruction}>
        Click button to show create a token based on example card params.
      </Text>
      <Button
        title="Create token"
        onPress={async () => {
          const params = {
            // mandatory
            number: '4242424242424242',
            expMonth: 11,
            expYear: 22,
            cvc: '223',
            // optional
            name: 'Test User',
            currency: 'usd',
            addressLine1: '123 Test Street',
            addressLine2: 'Apt. 5',
            addressCity: 'Test City',
            addressState: 'Test State',
            addressCountry: 'Test Country',
            addressZip: '55555',
          };

          const token = await Payments.createTokenWithCardAsync(params);
          console.log({ token });
        }}
      />
      <Text style={styles.instruction}>
        Click button to launch Add Card view to accept payment.
      </Text>
      <Button
        title="Add card"
        onPress={async () => {
          const token = await Payments.paymentRequestWithCardFormAsync({
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
                phone: '123-4567',
                email: 'myemail@email.com',
              },
            },
          });
          console.log({ token });
        }}
      />

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
        {token && <Text style={styles.instruction}>Token: {(token as any).tokenId}</Text>}
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
