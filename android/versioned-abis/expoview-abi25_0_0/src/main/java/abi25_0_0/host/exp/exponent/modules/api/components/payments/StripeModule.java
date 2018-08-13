package abi25_0_0.host.exp.exponent.modules.api.components.payments;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;

import abi25_0_0.com.facebook.react.bridge.ActivityEventListener;
import abi25_0_0.com.facebook.react.bridge.Arguments;
import abi25_0_0.com.facebook.react.bridge.BaseActivityEventListener;
import abi25_0_0.com.facebook.react.bridge.Promise;
import abi25_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi25_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi25_0_0.com.facebook.react.bridge.ReactMethod;
import abi25_0_0.com.facebook.react.bridge.ReadableArray;
import abi25_0_0.com.facebook.react.bridge.ReadableMap;
import abi25_0_0.com.facebook.react.bridge.WritableMap;

import host.exp.expoview.R;
import abi25_0_0.host.exp.exponent.modules.api.components.payments.dialog.AddCardDialogFragment;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.BooleanResult;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.wallet.Cart;
import com.google.android.gms.wallet.FullWallet;
import com.google.android.gms.wallet.FullWalletRequest;
import com.google.android.gms.wallet.IsReadyToPayRequest;
import com.google.android.gms.wallet.LineItem;
import com.google.android.gms.wallet.MaskedWallet;
import com.google.android.gms.wallet.MaskedWalletRequest;
import com.google.android.gms.wallet.PaymentMethodTokenizationParameters;
import com.google.android.gms.wallet.PaymentMethodTokenizationType;
import com.google.android.gms.wallet.Wallet;
import com.google.android.gms.wallet.WalletConstants;
import com.stripe.android.BuildConfig;
import com.stripe.android.Stripe;
import com.stripe.android.TokenCallback;
import com.stripe.android.exception.AuthenticationException;
import com.stripe.android.model.BankAccount;
import com.stripe.android.model.Card;
import com.stripe.android.model.Token;

import org.json.JSONException;

public class StripeModule extends ReactContextBaseJavaModule {


  private static final String TAG = StripeModule.class.getSimpleName();
  private static final String MODULE_NAME = "StripeModule";

  private static final int LOAD_MASKED_WALLET_REQUEST_CODE = 100502;
  private static final int LOAD_FULL_WALLET_REQUEST_CODE = 100503;

  public static final int mEnvironment = WalletConstants.ENVIRONMENT_TEST;
  private static final String PURCHASE_CANCELLED = "PURCHASE_CANCELLED";

  //androidPayParams keys:
  private static final String CURRENCY_CODE = "currency_code";
  private static final String TOTAL_PRICE = "total_price";
  private static final String UNIT_PRICE = "unit_price";
  private static final String LINE_ITEMS = "line_items";
  private static final String QUANTITY = "quantity";
  private static final String DESCRIPTION = "description";


  private Promise payPromise;

  private String publicKey;
  private Stripe stripe;
  private GoogleApiClient googleApiClient;

  private ReadableMap androidPayParams;

  private final ActivityEventListener mActivityEventListener = new BaseActivityEventListener() {

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {

      if (payPromise != null) {
        if (requestCode == LOAD_MASKED_WALLET_REQUEST_CODE) { // Unique, identifying constant

          handleLoadMascedWaletRequest(resultCode, data);

        } else if (requestCode == LOAD_FULL_WALLET_REQUEST_CODE) {
          if (resultCode == Activity.RESULT_OK) {
            FullWallet fullWallet = data.getParcelableExtra(WalletConstants.EXTRA_FULL_WALLET);
            String tokenJSON = fullWallet.getPaymentMethodToken().getToken();

            //A token will only be returned in production mode,
            //i.e. WalletConstants.ENVIRONMENT_PRODUCTION
            if (mEnvironment == WalletConstants.ENVIRONMENT_PRODUCTION) {
              Token token = Token.fromString(tokenJSON);
              Log.d(TAG, "onActivityResult: Stripe Token: " + token.toString());
              payPromise.resolve(token.toString());
            }
          }
        } else {
          super.onActivityResult(activity, requestCode, resultCode, data);
        }
      }
    }
  };
  private Context mContext;


  public StripeModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mContext = reactContext;
    // Add the listener for `onActivityResult`
    reactContext.addActivityEventListener(mActivityEventListener);
  }

  @Override
  public String getName() {
    return MODULE_NAME;
  }

  @ReactMethod
  public void initialize(ReadableMap options) {
    publicKey = options.getString("publishableKey");
    stripe = new Stripe(mContext, publicKey);
  }

  @ReactMethod
  public void deviceSupportsAndroidPayAsync(final Promise promise) {
    if (googleApiClient != null && googleApiClient.isConnected()) {
      checkAndroidPayAvaliable(googleApiClient, promise);
    } else if (googleApiClient != null && !googleApiClient.isConnected()) {
      googleApiClient.registerConnectionCallbacks(new GoogleApiClient.ConnectionCallbacks() {
        @Override
        public void onConnected(@Nullable Bundle bundle) {
          checkAndroidPayAvaliable(googleApiClient, promise);
        }

        @Override
        public void onConnectionSuspended(int i) {
          promise.reject(TAG, "onConnectionSuspended i = " + i);
        }
      });
      googleApiClient.connect();
    } else if (googleApiClient == null && getCurrentActivity() != null) {
      googleApiClient = new GoogleApiClient.Builder(getCurrentActivity())
          .addConnectionCallbacks(new GoogleApiClient.ConnectionCallbacks() {
            @Override
            public void onConnected(@Nullable Bundle bundle) {
              Log.d(TAG, "onConnected: ");
              checkAndroidPayAvaliable(googleApiClient, promise);
            }

            @Override
            public void onConnectionSuspended(int i) {
              Log.d(TAG, "onConnectionSuspended: ");
              promise.reject(TAG, "onConnectionSuspended i = " + i);
            }
          })
          .addOnConnectionFailedListener(new GoogleApiClient.OnConnectionFailedListener() {
            @Override
            public void onConnectionFailed(@NonNull ConnectionResult connectionResult) {
              Log.d(TAG, "onConnectionFailed: ");
              promise.reject(TAG, "onConnectionFailed: " + connectionResult.getErrorMessage());
            }
          })
          .addApi(Wallet.API, new Wallet.WalletOptions.Builder()
              .setEnvironment(WalletConstants.ENVIRONMENT_TEST)
              .setTheme(WalletConstants.THEME_LIGHT)
              .build())
          .build();
      googleApiClient.connect();
    } else {
      promise.reject(TAG, "Unknown error");
    }
  }

  @ReactMethod
  public void createTokenWithCardAsync(final ReadableMap cardData, final Promise promise) {
    try {

      stripe.createToken(createCard(cardData),
          publicKey,
          new TokenCallback() {
            public void onSuccess(Token token) {
              promise.resolve(convertTokenToWritableMap(token));
            }

            public void onError(Exception error) {
              error.printStackTrace();
              promise.reject(TAG, error.getMessage());
            }
          });
    } catch (Exception e) {
      promise.reject(TAG, e.getMessage());
    }
  }

  @ReactMethod
  public void createTokenWithBankAccountAsync(final ReadableMap accountData, final Promise promise) {
    try {
      stripe.createBankAccountToken(createBankAccount(accountData),
          publicKey,
          null,
          new TokenCallback() {
            public void onSuccess(Token token) {
              promise.resolve(convertTokenToWritableMap(token));
            }

            public void onError(Exception error) {
              error.printStackTrace();
              promise.reject(TAG, error.getMessage());
            }
          });
    } catch (Exception e) {
      promise.reject(TAG, e.getMessage());
    }
  }

  @ReactMethod
  public void paymentRequestWithCardFormAsync(ReadableMap unused, final Promise promise) {
    if (getCurrentActivity() != null) {
      final AddCardDialogFragment cardDialog = AddCardDialogFragment.newInstance(publicKey, getReactApplicationContext());
      cardDialog.setPromise(promise);
      cardDialog.show(getCurrentActivity().getFragmentManager(), "AddNewCard");
    }
  }

  @ReactMethod
  public void paymentRequestWithAndroidPayAsync(final ReadableMap map, final Promise promise) {
    Log.d(TAG, "startAndroidPay: ");
    if (getCurrentActivity() != null) {
      payPromise = promise;
      Log.d(TAG, "startAndroidPay: getCurrentActivity() != null");
      startApiClientAndAndroidPay(getCurrentActivity(), map);
    }
  }

  private void startApiClientAndAndroidPay(final Activity activity, final ReadableMap map) {
    if (googleApiClient != null && googleApiClient.isConnected()) {
      startAndroidPay(map);
    } else {
      googleApiClient = new GoogleApiClient.Builder(activity)
          .addConnectionCallbacks(new GoogleApiClient.ConnectionCallbacks() {
            @Override
            public void onConnected(@Nullable Bundle bundle) {
              Log.d(TAG, "onConnected: ");
              startAndroidPay(map);
            }

            @Override
            public void onConnectionSuspended(int i) {
              Log.d(TAG, "onConnectionSuspended: ");
              payPromise.reject(TAG, "onConnectionSuspended i = " + i);
            }
          })
          .addOnConnectionFailedListener(new GoogleApiClient.OnConnectionFailedListener() {
            @Override
            public void onConnectionFailed(@NonNull ConnectionResult connectionResult) {
              Log.d(TAG, "onConnectionFailed: ");
              payPromise.reject(TAG, "onConnectionFailed: " + connectionResult.getErrorMessage());
            }
          })
          .addApi(Wallet.API, new Wallet.WalletOptions.Builder()
              .setEnvironment(WalletConstants.ENVIRONMENT_TEST)
              .setTheme(WalletConstants.THEME_LIGHT)
              .build())
          .build();
      googleApiClient.connect();
    }
  }

  private void showAndroidPay(final ReadableMap map) {
    androidPayParams = map;
    final String estimatedTotalPrice = map.getString(TOTAL_PRICE);
    final String currencyCode = map.getString(CURRENCY_CODE);
    final MaskedWalletRequest maskedWalletRequest = createWalletRequest(estimatedTotalPrice, currencyCode);
    Wallet.Payments.loadMaskedWallet(googleApiClient, maskedWalletRequest, LOAD_MASKED_WALLET_REQUEST_CODE);
  }

  private MaskedWalletRequest createWalletRequest(final String estimatedTotalPrice, final String currencyCode) {

    final MaskedWalletRequest maskedWalletRequest = MaskedWalletRequest.newBuilder()

        // Request credit card tokenization with Stripe by specifying tokenization parameters:
        .setPaymentMethodTokenizationParameters(PaymentMethodTokenizationParameters.newBuilder()
            .setPaymentMethodTokenizationType(PaymentMethodTokenizationType.PAYMENT_GATEWAY)
            .addParameter("gateway", "stripe")
            .addParameter("stripe:publishableKey", publicKey)
            .addParameter("stripe:version", BuildConfig.VERSION_NAME)
            .build())
        // You want the shipping address:
        .setShippingAddressRequired(true)

        // Price set as a decimal:
        .setEstimatedTotalPrice(estimatedTotalPrice)
        .setCurrencyCode(currencyCode)
        .build();
    return maskedWalletRequest;
  }

  private void androidPayUnavaliableDialog() {
    new AlertDialog.Builder(getCurrentActivity())
        .setMessage(R.string.android_pay_unavaliable)
        .setPositiveButton(android.R.string.ok, null)
        .show();
  }

  private void handleLoadMascedWaletRequest(int resultCode, Intent data) {
    if (resultCode == Activity.RESULT_OK) {
      MaskedWallet maskedWallet = data.getParcelableExtra(WalletConstants.EXTRA_MASKED_WALLET);

      final Cart.Builder cartBuilder = Cart.newBuilder()
          .setCurrencyCode(androidPayParams.getString(CURRENCY_CODE))
          .setTotalPrice(androidPayParams.getString(TOTAL_PRICE));

      final ReadableArray lineItems = androidPayParams.getArray(LINE_ITEMS);
      if (lineItems != null) {
        for (int i = 0; i < lineItems.size(); i++) {
          final ReadableMap lineItem = lineItems.getMap(i);
          cartBuilder.addLineItem(LineItem.newBuilder() // Identify item being purchased
              .setCurrencyCode(lineItem.getString(CURRENCY_CODE))
              .setQuantity(lineItem.getString(QUANTITY))
              .setDescription(DESCRIPTION)
              .setTotalPrice(TOTAL_PRICE)
              .setUnitPrice(UNIT_PRICE)
              .build());
        }
      }

      final FullWalletRequest fullWalletRequest = FullWalletRequest.newBuilder()
          .setCart(cartBuilder.build())
          .setGoogleTransactionId(maskedWallet.getGoogleTransactionId())
          .build();

      Wallet.Payments.loadFullWallet(googleApiClient, fullWalletRequest, LOAD_FULL_WALLET_REQUEST_CODE);
    } else {
      payPromise.reject(PURCHASE_CANCELLED, "Purchase was cancelled");
    }
  }

  private IsReadyToPayRequest doIsReadyToPayRequest() {
    return IsReadyToPayRequest.newBuilder().build();
  }

  private void checkAndroidPayAvaliable(final GoogleApiClient client, final Promise promise) {
    Wallet.Payments.isReadyToPay(client, doIsReadyToPayRequest()).setResultCallback(
        new ResultCallback<BooleanResult>() {
          @Override
          public void onResult(@NonNull BooleanResult booleanResult) {
            if (booleanResult.getStatus().isSuccess()) {
              promise.resolve(booleanResult.getValue());
            } else {
              // Error making isReadyToPay call
              Log.e(TAG, "isReadyToPay:" + booleanResult.getStatus());
              promise.reject(TAG, booleanResult.getStatus().getStatusMessage());
            }
          }
        });
  }

  private void startAndroidPay(final ReadableMap map) {
    Wallet.Payments.isReadyToPay(googleApiClient, doIsReadyToPayRequest()).setResultCallback(
        new ResultCallback<BooleanResult>() {
          @Override
          public void onResult(@NonNull BooleanResult booleanResult) {
            Log.d(TAG, "onResult: ");
            if (booleanResult.getStatus().isSuccess()) {
              Log.d(TAG, "onResult: booleanResult.getStatus().isSuccess()");
              if (booleanResult.getValue()) {
                // TODO Work only in few countries. I don't now how test it in our countries.
                Log.d(TAG, "onResult: booleanResult.getValue()");
                showAndroidPay(map);
              } else {
                Log.d(TAG, "onResult: !booleanResult.getValue()");
                // Hide Android Pay buttons, show a message that Android Pay
                // cannot be used yet, and display a traditional checkout button
                androidPayUnavaliableDialog();
                payPromise.reject(TAG, "Android Pay unavaliable");
              }
            } else {
              // Error making isReadyToPay call
              Log.e(TAG, "isReadyToPay:" + booleanResult.getStatus());
              androidPayUnavaliableDialog();
              payPromise.reject(TAG, "Error making isReadyToPay call");
            }
          }
        }
    );
  }

  private Card createCard(final ReadableMap cardData) {
    return new Card(
        // required fields
        cardData.getString("number"),
        cardData.getInt("expMonth"),
        cardData.getInt("expYear"),
        // additional fields
        exist(cardData, "cvc"),
        exist(cardData, "name"),
        exist(cardData, "addressLine1"),
        exist(cardData, "addressLine2"),
        exist(cardData, "addressCity"),
        exist(cardData, "addressState"),
        exist(cardData, "addressZip"),
        exist(cardData, "addressCountry"),
        exist(cardData, "brand"),
        exist(cardData, "last4"),
        exist(cardData, "fingerprint"),
        exist(cardData, "funding"),
        exist(cardData, "country"),
        exist(cardData, "currency"),
        exist(cardData, "id")
    );
  }

  private WritableMap convertTokenToWritableMap(Token token) {
    WritableMap newToken = Arguments.createMap();

    if (token == null) return newToken;

    newToken.putString("tokenId", token.getId());
    newToken.putBoolean("livemode", token.getLivemode());
    newToken.putBoolean("used", token.getUsed());
    newToken.putDouble("created", token.getCreated().getTime());

    if (token.getCard() != null) {
      newToken.putMap("card", convertCardToWritableMap(token.getCard()));
    }
    if (token.getBankAccount() != null) {
      newToken.putMap("bankAccount", convertBankAccountToWritableMap(token.getBankAccount()));
    }

    return newToken;
  }

  private WritableMap convertCardToWritableMap(final Card card) {
    WritableMap result = Arguments.createMap();

    if(card == null) return result;

    result.putString("number", card.getNumber());
    result.putString("cvc", card.getCVC() );
    result.putInt("expMonth", card.getExpMonth() );
    result.putInt("expYear", card.getExpYear() );
    result.putString("name", card.getName() );
    result.putString("addressLine1", card.getAddressLine1() );
    result.putString("addressLine2", card.getAddressLine2() );
    result.putString("addressCity", card.getAddressCity() );
    result.putString("addressState", card.getAddressState() );
    result.putString("addressZip", card.getAddressZip() );
    result.putString("addressCountry", card.getAddressCountry() );
    result.putString("last4", card.getLast4() );
    result.putString("brand", card.getBrand() );
    result.putString("funding", card.getFunding() );
    result.putString("fingerprint", card.getFingerprint() );
    result.putString("country", card.getCountry() );
    result.putString("currency", card.getCurrency() );

    return result;
  }

  private WritableMap convertBankAccountToWritableMap(BankAccount account) {
    WritableMap result = Arguments.createMap();

    if(account == null) return result;

    result.putString("routingNumber", account.getRoutingNumber());
    result.putString("accountNumber", account.getAccountNumber());
    result.putString("countryCode", account.getCountryCode());
    result.putString("currency", account.getCurrency());
    result.putString("accountHolderName", account.getAccountHolderName());
    result.putString("accountHolderType", account.getAccountHolderType());
    result.putString("fingerprint", account.getFingerprint());
    result.putString("bankName", account.getBankName());
    result.putString("last4", account.getLast4());

    return result;
  }

  private BankAccount createBankAccount(ReadableMap accountData) {
    BankAccount account = new BankAccount(
        // required fields only
        accountData.getString("accountNumber"),
        accountData.getString("countryCode"),
        accountData.getString("currency"),
        exist(accountData, "routingNumber", "")
    );
    account.setAccountHolderName(exist(accountData, "accountHolderName"));
    account.setAccountHolderType(exist(accountData, "accountHolderType"));

    return account;
  }

  private String exist(final ReadableMap map, final String key, final String def) {
    if (map.hasKey(key)) {
      return map.getString(key);
    } else {
      // If map don't have some key - we must pass to constructor default value.
      return def;
    }
  }

  private String exist(final ReadableMap map, final String key) {
    return exist(map, key, null);
  }
}
