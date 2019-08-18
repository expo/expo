/*
Payments.js
Jasmine tests for the tipsi-stripe payments module.
Note: the Apple Pay tests in this file needs to be run on an iOS simulator or an iOS real device. Stripe tests run on both iOS and Android.

Jeffrey Da, Expo Inc., July 2017
*/
'use strict';

import { DangerZone } from 'expo';
import { Platform } from 'react-native';

export const name = 'Payments';

export function test(t) {
  // NOTE(2017-08-30): Payments are unsupported on iOS; for now just skip all
  // the tests
  return;
  const Payments = DangerZone.Payments;

  Payments.initialize({
    // This is Jeff's publishable key.
    publishableKey: 'pk_test_YRjUHSZfJza9RsuNDx9s6e5V',
    merchantId: 'merchant.fakeId',
  });

  t.describe('Payments', () => {
    t.describe('Stripe', () => {
      t.it('suscessfully creates a token with card details', async () => {
        const token = await Payments.createTokenWithCardAsync({
          // mandatory
          number: '4242424242424242',
          expMonth: 11,
          expYear: 17,
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
        });
        t.expect(token.card.brand).toBe('Visa');
        t.expect(token.card.isApplePayCard).toBe(false);
        t.expect(token.tokenId.charAt(0)).toBe('t');
      });

      t.it('suscessfully creates a token with minimum card details', async () => {
        const token = await Payments.createTokenWithCardAsync({
          number: '4242424242424242',
          expMonth: 11,
          expYear: 17,
          cvc: '223',
        });
        t.expect(token.card.brand).toBe('Visa');
        t.expect(token.card.isApplePayCard).toBe(false);
        t.expect(token.tokenId.charAt(0)).toBe('t');
      });

      t.it('recognizes and stores extra card details in Stripe token', async () => {
        const token = await Payments.createTokenWithCardAsync({
          // mandatory
          number: '4242424242424242',
          expMonth: 11,
          expYear: 17,
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
        });
        t.expect(token.card.brand).toBe('Visa');
        t.expect(token.card.isApplePayCard).toBe(false);
        t.expect(token.card.name).toBe('Test User');
        t.expect(token.card.currency).toBe('usd');
        t.expect(token.tokenId.charAt(0)).toBe('t');
      });

      t.it(
        'recognizes when invalid card details are given and throws Invalid Card error',
        async () => {
          let error = null;
          try {
            await Payments.createTokenWithCardAsync({
              // mandatory
              number: 'false',
              expMonth: 11,
              expYear: 17,
              cvc: '999',
              // optional
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
            error = e;
          }
          t.expect(error).toEqual(new Error("Your card's number is invalid"));
        }
      );

      t.it(
        'recognizes when insufficent details are given and throws Insufficent Details error',
        async () => {
          let error = null;
          try {
            await Payments.createTokenWithCardAsync({
              // mandatory
              number: '4242424242424242',
              expMonth: 11,
              // no CVC or expYear given, as described in the test above
            });
          } catch (e) {
            error = e;
          }
          t.expect(error).toEqual(new Error("Your card's expiration year is invalid"));
        }
      );
    });
    if (Platform.OS === 'ios') {
      t.describe('Apple Pay', () => {
        t.it('determines if a device is Apple Pay enabled', async () => {
          const doesSupportApplePay = await Payments.deviceSupportsApplePayAsync();
          t.expect(doesSupportApplePay).toBe(true || false);
        });
        t.it(
          'determines if items and options are valid, and if invalid throws Invalid Parameter exception',
          async () => {
            let error = null;
            try {
              await Payments.paymentRequestWithApplePayAsync([{}], {
                shippingMethods: [{}],
              });
            } catch (e) {
              error = e;
            }
            t.expect(error).toEqual(new Error('Apple Pay configuration error'));
          }
        );

        t.it(
          'recongnizes when Apple Pay requests through the payments dialog can be completed',
          async () => {
            let error = null;
            try {
              await completeApplePayRequestAsync();
            } catch (e) {
              error = e;
            }
            t.expect(error).toBeTruthy();
          }
        );

        t.it(
          'recongnizes when Apple Pay requests through the payments dialog can be canceled',
          async () => {
            let error = null;
            try {
              await cancelApplePayRequestAsync();
            } catch (e) {
              error = e;
            }
            console.log(error);
            t.expect(error).toBeTruthy();
          }
        );
      });
    }
  });
}
