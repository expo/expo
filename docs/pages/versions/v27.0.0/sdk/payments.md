---
title: Payments
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

Expo includes support for payments through [Stripe](https://stripe.com/) and [Apple Pay](https://www.apple.com/apple-pay/) on iOS via ExpoKit, and Stripe and Android Pay on Android.

Need more help than what's on the page? The Payments module is largely based off [tipsi-stripe](https://github.com/tipsi/tipsi-stripe). The documentation and questions there may prove helpful.

## Setup

If you haven't done payments with Stripe before, create an account with [Stripe](https://dashboard.stripe.com/register). After getting the account set up, navigate to the [Stripe API dashboard](https://dashboard.stripe.com/account/apikeys). Here, you'll need to make a note of the Publishable key and Secret key listed.

## Adding the Payments Module on iOS

The Payments module is currently only supported through ExpoKit on iOS (to understand why, refer to [Why ExpoKit on iOS?](#why-expokit-on-ios)).

First, detach your Expo project using ExpoKit (refer to [Detach to ExpoKit](../../expokit/detach/) for more information). Then, navigate to and open `your-project-name/ios/Podfile`. Add "Payments" to your Podfile's subspecs. Example:

```ruby

...
target 'your-project-name' do
  pod 'ExpoKit',
    :git => "https://github.com/expo/expo.git",
    :subspecs => [
      "Core",
      "CPP", # Add a comma here!
      "Payments" # Add this line here!
    ]

  pod 'React',
  ...

```

Finally, make sure [CocoaPods](https://cocoapods.org/) is installed and run `pod install` in `your-project-name/ios`. This will add the Payments module files to your project and the corresponding dependencies.

## Adding the Payments Module on Android

The Payments module is included with the Expo bundle on Android. Skip ahead to [importing payments](#importing-payments).

## Importing Payments

The Payments SDK is in Alpha and currently lives under Expo's **DangerZone** namespace. You can import it like this:

```javascript
import { DangerZone } from 'expo';
const { Payments } = DangerZone;
```

## Using the Payments SDK

First, initialize the Payments module with your credentials:

```javascript
payments.initialize({
  publishableKey: 'PUBLISHABLE_KEY' // Your Stripe publishable key
})
```

Next, you'll need to create a token object. After creating the token, you'll need to send it to some kind of backend (for example, a [Node.js server](https://stripe.com/docs/api/node)) to handle processing the payment. It's important not to handle sensitive card details in the front-end Expo application.

### The Token object

A token object returned from submitting payment details (via `paymentRequestWithApplePayAsync` and `createTokenWithCardAsync`) to the Stripe API.

##### `token`

An object with the following keys:

* `tokenId` _String_ - The value of the token. You can store this value on your server and use it to make charges and customers.
* `created` _Number_ - When the token was created.
* `livemode` _Number_ - Whether or not this token was created in livemode. Will be `1` if you used your `Live Publishable Key`, and `0` if you used your `Test Publishable Key`.
* `card` _Object_ - The credit card details object that were used to create the token.
* `bankAccount` _Object_ - The external (bank) account details object that were used to create the token.
* `extra` _Object_  (iOS only)- An additional information that method can provide.

##### `card`

An object with the following keys:

* `cardId` _String_ - The Stripe ID for the card.
* `brand` _String_ - The card’s brand. Can be one of: `JCB`|`American Express`|`Visa`|`Discover`|`Diners Club`|`MasterCard`|`Unknown`.
* `funding` _String_ (iOS only) - The card’s funding. Can be one of: `debit`|`credit`|`prepaid`|`unknown`.
* `last4` _String_ - The last 4 digits of the card.
* `dynamicLast4` _String_ (iOS only) - For cards made with `Apple Pay`, this refers to the last 4 digits of the `Device Account Number` for the tokenized card.
* `isApplePayCard` _Bool_ (iOS only) - Whether or not the card originated from Apple Pay.
* `expMonth` _Number_ - The card’s expiration month. 1-indexed (i.e. 1 == January)
* `expYear` _Number_ - The card’s expiration year.
* `country` _String_ - Two-letter ISO code representing the issuing country of the card.
* `currency` _String_ - This is only applicable when tokenizing debit cards to issue payouts to managed accounts. The card can then be used as a transfer destination for funds in this currency.
* `name` _String_ - The cardholder’s name.
* `addressLine1` _String_ - The cardholder’s first address line.
* `addressLine2` _String_ - The cardholder’s second address line.
* `addressCity` _String_ - The cardholder’s city.
* `addressState` _String_ - The cardholder’s state.
* `addressCountry` _String_ - The cardholder’s country.
* `addressZip` _String_ - The cardholder’s zip code.

#### Example

```js
{
  tokenId: 'tok_19GCAQI5NuVQgnjeKNE32K0p',
  created: 1479236426,
  livemode: 0,
  card: {
    cardId: 'card_19GCAQI5NuVQgnjeRZizG4U3',
    brand: 'Visa',
    funding: 'credit',
    last4: '4242',
    expMonth: 4,
    expYear: 2024,
    country: 'US',
    name: 'Eugene Grissom',
    addressLine1: 'Green Street',
    addressLine2: '3380',
    addressCity: 'Nashville',
    addressState: 'Tennessee',
    addressCountry: 'US',
    addressZip: '37211',
  },
}
```

### Generating a token with Apple Pay

Remember: to use Apple Pay on a real device, you need to [set up apple pay first](#enabling-apple-pay-in-expokit).

### `openApplePaySetup()`

Opens the user interface to set up credit cards for Apple Pay.

### `deviceSupportsApplePayAsync() -> Promise`

Returns whether the user can make Apple Pay payments.
User may not be able to make payments for a variety of reasons. For example, this functionality may not be supported by their hardware, or it may be restricted by parental controls.
Returns `true` if the device supports making payments; otherwise, `false`.

_NOTE_: iOS Simulator always returns `true`

### `paymentRequestWithApplePayAsync(items, [options]) -> Promise`

Launch the `Apple Pay` view to accept payment.

#### `items`

An array of object with the following keys:

* `label` _String_ - A short, localized description of the item.
* `amount` _String_ - The summary item’s amount.

_NOTE_: The final item should represent your company; it'll be prepended with the word "Pay" (i.e. "Pay Tipsi, Inc $50")

#### `options`

An object with the following keys:

* `requiredBillingAddressFields` _String_ - A bit field of billing address fields that you need in order to process the transaction. Can be one of: `all`|`name`|`email`|`phone`|`postal_address` or not specify to disable.
* `requiredShippingAddressFields` _String_ - A bit field of shipping address fields that you need in order to process the transaction. Can be one of: `all`|`name`|`email`|`phone`|`postal_address` or not specify to disable.
* `shippingMethods` _Array_ - An array of `shippingMethod` objects that describe the supported shipping methods.
* `currencyCode` _String_ - The three-letter ISO 4217 currency code.

#### `shippingMethod`

An object with the following keys:

* `id` _String_ - A unique identifier for the shipping method, used by the app.
* `label` _String_ - A short, localized description of the shipping method.
* `detail` _String_ - A user-readable description of the shipping method.
* `amount` _String_ - The shipping method’s amount.

### `completeApplePayRequestAsync()/cancelApplePayRequestAsync() -> Promise`

After `requiredBillingAddressFields` you should complete the operation by calling `completeApplePayRequest` or cancel if an error occurred. This closes Apple Pay. (resolves to undefined, you do not need to store the Promise)

#### Extra info

Token's `extra` field

#### `extra`

An object with the following keys:

* `shippingMethod` _Object_ - Selected `shippingMethod` object.
* `billingContact` _Object_ - The user's billing `contact` object.
* `shippingContact` _Object_ - The user's shipping `contact` object.

#### `contact`

An object with the following keys:

* `name` _String_ - The contact’s name.
* `phoneNumber` _String_ - The contact’s phone number.
* `emailAddress` _String_ - The contact’s email address.
* `street` _String_ - The street name in a postal address.
* `city` _String_ - The city name in a postal address.
* `state` _String_ - The state name in a postal address.
* `country` _String_ - The country name in a postal address.
* `ISOCountryCode` _String_ - The ISO country code for the country in a postal address.
* `postalCode` _String_ - The postal code in a postal address.
* `supplementarySubLocality` _String_ - The contact’s sublocality.

#### Example

```js
const items = [{
  label: 'T-Shirt',
  amount: '50.00',
}, {
  label: 'Expo, Inc',
  amount: '50.00',
}]

const shippingMethods = [{
  id: 'fedex',
  label: 'FedEX',
  detail: 'Test @ 10',
  amount: '10.00',
}]

const options = {
  requiredBillingAddressFields: 'all',
  requiredShippingAddressFields: 'all',
  shippingMethods,
}

const token = await payments.paymentRequestWithApplePayAsync(items, options)

// Client specific code
// api.sendTokenToBackend(token)

// You should complete the operation by calling
payments.completeApplePayRequestAsync()

// Or cancel if an error occurred
// payments.cancelApplePayRequestAsync()
```

### Generating a token by launching a card form

### `paymentRequestWithCardFormAsync(options) -> Promise`

This promise launches a Card Form dialog and resolves to a token upon successful completion of the card form, and an error otherwise.

##### `options`

An object with the following keys:

* `requiredBillingAddressFields` _String_ - The billing address fields the user must fill out when prompted for their payment details. Can be one of: `full`|`zip` or not specify to disable.
* `prefilledInformation` _Object_ - You can set this property to pre-fill any information you’ve already collected from your user.
* `managedAccountCurrency` _String_ - Required to be able to add the card to an account (in all other cases, this parameter is not used). [More info](https://stripe.com/docs/api#create_card_token-card-currency).
* `smsAutofillDisabled` _Bool_ - When entering their payment information, users who have a saved card with Stripe will be prompted to autofill it by entering an SMS code. Set this property to `true` to disable this feature.
* `theme` _Object_ - Can be used to visually style Stripe-provided UI.

##### `prefilledInformation`

An object with the following keys:

* `email` _String_ - The user’s email address.
* `phone` _String_ - The user’s phone number.
* `billingAddress` _Object_ - The user’s billing address. When set, the add card form will be filled with this address.

##### `billingAddress`

An object with the following keys:

* `name` _String_ - The user’s full name (e.g. "Jane Doe").
* `line1` _String_ - The first line of the user’s street address (e.g. "123 Fake St").
* `line2` _String_ - The apartment, floor number, etc of the user’s street address (e.g. "Apartment 1A").
* `city` _String_ - The city in which the user resides (e.g. "San Francisco").
* `state` _String_ - The state in which the user resides (e.g. "CA").
* `postalCode` _String_ - The postal code in which the user resides (e.g. "90210").
* `country` _String_ - The ISO country code of the address (e.g. "US").
* `phone` _String_ - The phone number of the address (e.g. "8885551212").
* `email` _String_ - The email of the address (e.g. "jane@doe.com").

##### `theme`

An object with the following keys:

* `primaryBackgroundColor` _String_ - The primary background color of the theme.
* `secondaryBackgroundColor` _String_ - The secondary background color of this theme.
* `primaryForegroundColor` _String_ - The primary foreground color of this theme. This will be used as the text color for any important labels in a view with this theme (such as the text color for a text field that the user needs to fill out).
* `secondaryForegroundColor` _String_ - The secondary foreground color of this theme. This will be used as the text color for any supplementary labels in a view with this theme (such as the placeholder color for a text field that the user needs to fill out).
* `accentColor` _String_ - The accent color of this theme - it will be used for any buttons and other elements on a view that are important to highlight.
* `errorColor` _String_ - The error color of this theme - it will be used for rendering any error messages or view.

#### Example

```js
const options = {
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
    },
  },
}

const token = await Payments.paymentRequestWithCardFormAsync(options)

// Client specific code
// api.sendTokenToBackend(token)
```

### Generating a token with a custom card form

It's also possible to generate a token by simply passing the necessary details in a parameter.

### `createTokenWithCardAsync(params) -> Promise`

#### `params`

An object with the following keys:

* `number` _String_ (Required) - The card’s number.
* `expMonth` _Number_ (Required) - The card’s expiration month.
* `expYear` _Number_ (Required) - The card’s expiration year.
* `cvc` _String_ - The card’s security code, found on the back.
* `name` _String_ - The cardholder’s name.
* `addressLine1` _String_ - The first line of the billing address.
* `addressLine2` _String_ - The second line of the billing address.
* `addressCity` _String_ - City of the billing address.
* `addressState` _String_ - State of the billing address.
* `addressZip` _String_ - Zip code of the billing address.
* `addressCountry` _String_ - Country for the billing address.
* `brand` _String_ (Android only) - Brand of this card. Can be one of: `JCB`|`American Express`|`Visa`|`Discover`|`Diners Club`|`MasterCard`|`Unknown`.
* `last4` _String_ (Android only) - last 4 digits of the card.
* `fingerprint` _String_ (Android only) - The card fingerprint.
* `funding` _String_ (Android only) - The funding type of the card. Can be one of: `debit`|`credit`|`prepaid`|`unknown`.
* `country` _String_ (Android only) - ISO country code of the card itself.
* `currency` _String_ - Three-letter ISO currency code representing the currency paid out to the bank account. This is only applicable when tokenizing debit cards to issue payouts to managed accounts. You should not set it otherwise. The card can then be used as a transfer destination for funds in this currency.

#### Example

```js
const params = {
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
}

const token = await stripe.createTokenWithCardAsync(params)

// Client specific code
// api.sendTokenToBackend(token)
```

## Enabling Apple Pay in ExpoKit

If you want to use Apple Pay for payments, you'll need to set up your merchant ID in XCode first. Note that you do not need to go through this process to use the Payments module - you can still process payments with Stripe without going through the steps in this section.

If you haven't already, set up an Apple Merchant ID via the [Apple Developer Portal](https://developer.apple.com/). Then, open the application in XCode and navigate to the capabilities tab. Enable Apple Pay and insert your merchant ID into the corresponding space.

![applepay](/static/icloud-entitlement.png)

Finally, you'll want to include your merchant ID in the JavaScript code before publishing your standalone application. Change the initialization of payments to mimic the following:

```javascript
payments.initialize({
  publishableKey: 'PUBLISHABLE_KEY', // Your Stripe publishable key
  merchantId: 'MERCHANT_ID' // Your Apple Pay merchant ID
})
```

Note: Apple Pay can be used only for real world items (ex. appeal, car sharing, food) and not virtual goods. For more information about proper usage of Apple Pay, visit Apple's [Apple Pay guidelines](https://developer.apple.com/app-store/review/guidelines/#apple-pay) and [Acceptable Use](https://developer.apple.com/apple-pay/acceptable-use-guidelines-for-websites/).

## Why ExpoKit on iOS?

Expo previously included support for a native Payments API without ExpoKit. We learned that apple sometimes rejects apps which contain the Stripe SDK but don’t offer anything for sale. To help your App Review process go more smoothly, we’ve decided to remove the Stripe SDK and experimental Payments API from apps built with the Expo standalone builder. We’re still excited to give developers a way to let users pay for goods when they need to and we’ll announce ways to do so shortly.
