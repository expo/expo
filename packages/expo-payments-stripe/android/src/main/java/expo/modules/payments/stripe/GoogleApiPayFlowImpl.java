package expo.modules.payments.stripe;
import android.app.Activity;
import android.content.Intent;
import android.support.annotation.NonNull;

import expo.core.Promise;
import expo.modules.payments.stripe.util.ArgCheck;
import expo.modules.payments.stripe.util.Converters;
import expo.modules.payments.stripe.util.Fun0;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.android.gms.wallet.AutoResolveHelper;
import com.google.android.gms.wallet.CardRequirements;
import com.google.android.gms.wallet.IsReadyToPayRequest;
import com.google.android.gms.wallet.PaymentData;
import com.google.android.gms.wallet.PaymentDataRequest;
import com.google.android.gms.wallet.PaymentMethodTokenizationParameters;
import com.google.android.gms.wallet.PaymentsClient;
import com.google.android.gms.wallet.ShippingAddressRequirements;
import com.google.android.gms.wallet.TransactionInfo;
import com.google.android.gms.wallet.Wallet;
import com.google.android.gms.wallet.WalletConstants;
import com.stripe.android.BuildConfig;
import com.stripe.android.model.Token;

import java.util.Arrays;
import java.util.Collection;
import java.util.Map;

import static expo.modules.payments.stripe.util.Converters.convertTokenToWritableMap;
import static expo.modules.payments.stripe.util.Converters.getAllowedShippingCountryCodes;
import static expo.modules.payments.stripe.util.Converters.getBillingAddress;
import static expo.modules.payments.stripe.util.Converters.putExtraToTokenMap;
import static expo.modules.payments.stripe.util.PayParams.BILLING_ADDRESS_REQUIRED;
import static expo.modules.payments.stripe.util.PayParams.CURRENCY_CODE;
import static expo.modules.payments.stripe.util.PayParams.SHIPPING_ADDRESS_REQUIRED;
import static expo.modules.payments.stripe.util.PayParams.TOTAL_PRICE;

/**
 * Created by ngoriachev on 13/03/2018.
 * see https://developers.google.com/pay/api/tutorial
 */
public final class GoogleApiPayFlowImpl extends PayFlow {

  private static final String TAG = GoogleApiPayFlowImpl.class.getSimpleName();
  private static final int LOAD_PAYMENT_DATA_REQUEST_CODE = 65534;

  private PaymentsClient mPaymentsClient;
  private Promise payPromise;

  public GoogleApiPayFlowImpl(@NonNull Fun0<Activity> activityProvider) {
    super(activityProvider);
  }

  private PaymentsClient createPaymentsClient(@NonNull Activity activity) {
    return Wallet.getPaymentsClient(
      activity,
      new Wallet.WalletOptions.Builder().setEnvironment(getEnvironment()).build());
  }

  private void isReadyToPay(@NonNull Activity activity, boolean isExistingPaymentMethodRequired, @NonNull final Promise promise) {
    ArgCheck.nonNull(activity);
    ArgCheck.nonNull(promise);

    IsReadyToPayRequest request =
      IsReadyToPayRequest.newBuilder()
        .addAllowedPaymentMethod(WalletConstants.PAYMENT_METHOD_CARD)
        .addAllowedPaymentMethod(WalletConstants.PAYMENT_METHOD_TOKENIZED_CARD)
        .setExistingPaymentMethodRequired(isExistingPaymentMethodRequired)
        .build();
    mPaymentsClient = createPaymentsClient(activity);
    Task<Boolean> task = mPaymentsClient.isReadyToPay(request);
    task.addOnCompleteListener(
      new OnCompleteListener<Boolean>() {
        public void onComplete(Task<Boolean> task) {
          try {
            boolean result = task.getResult(ApiException.class);
            promise.resolve(result);
          } catch (ApiException exception) {
            exception.printStackTrace();
            promise.reject(TAG, String.format("Error, statusCode: %d", exception.getStatusCode()));
          }
        }
      });
  }

  private PaymentMethodTokenizationParameters createPaymentMethodTokenizationParameters() {
    return PaymentMethodTokenizationParameters.newBuilder()
      .setPaymentMethodTokenizationType(WalletConstants.PAYMENT_METHOD_TOKENIZATION_TYPE_PAYMENT_GATEWAY)
      .addParameter("gateway", "stripe")
      .addParameter("stripe:publishableKey", getPublishableKey())
      .addParameter("stripe:version", BuildConfig.VERSION_NAME)
      .build();
  }

  private PaymentDataRequest createPaymentDataRequest(Map<String, Object> payParams) {
    final String estimatedTotalPrice = (String)payParams.get(TOTAL_PRICE);
    final String currencyCode = (String)payParams.get(CURRENCY_CODE);
    final boolean billingAddressRequired = Converters.getValue(payParams, BILLING_ADDRESS_REQUIRED, false);
    final Boolean shippingAddressRequired = Converters.getValue(payParams, SHIPPING_ADDRESS_REQUIRED, false);
    final Collection<String> allowedCountryCodes = getAllowedShippingCountryCodes(payParams);

    return createPaymentDataRequest(estimatedTotalPrice, currencyCode, billingAddressRequired, shippingAddressRequired, allowedCountryCodes);
  }

  private PaymentDataRequest createPaymentDataRequest(@NonNull final String totalPrice,
                                                      @NonNull final String currencyCode,
                                                      final boolean billingAddressRequired,
                                                      final boolean shippingAddressRequired,
                                                      @NonNull final Collection<String> countryCodes
  ) {

    ArgCheck.isDouble(totalPrice);
    ArgCheck.notEmptyString(currencyCode);

    PaymentDataRequest.Builder builder = PaymentDataRequest.newBuilder();
    builder.setTransactionInfo(
      TransactionInfo.newBuilder()
        .setTotalPriceStatus(WalletConstants.TOTAL_PRICE_STATUS_ESTIMATED)
        .setTotalPrice(totalPrice)
        .setCurrencyCode(currencyCode)
        .build());

    builder
      .setCardRequirements(
        CardRequirements.newBuilder()
          .addAllowedCardNetworks(
            Arrays.asList(
              WalletConstants.CARD_NETWORK_AMEX,
              WalletConstants.CARD_NETWORK_DISCOVER,
              WalletConstants.CARD_NETWORK_VISA,
              WalletConstants.CARD_NETWORK_MASTERCARD))
          .setBillingAddressRequired(billingAddressRequired)
          .build())
      .addAllowedPaymentMethod(WalletConstants.PAYMENT_METHOD_CARD)
      .addAllowedPaymentMethod(WalletConstants.PAYMENT_METHOD_TOKENIZED_CARD)
      .setShippingAddressRequired(shippingAddressRequired);

    if (countryCodes.size() > 0) {
      builder.setShippingAddressRequirements(
        ShippingAddressRequirements.newBuilder()
          .addAllowedCountryCodes(countryCodes)
          .build());
    }

    builder.setPaymentMethodTokenizationParameters(createPaymentMethodTokenizationParameters());
    return builder.build();
  }

  private void startPaymentRequest(@NonNull Activity activity, @NonNull PaymentDataRequest request) {
    ArgCheck.nonNull(activity);
    ArgCheck.nonNull(request);

    mPaymentsClient = createPaymentsClient(activity);

    AutoResolveHelper.resolveTask(
      mPaymentsClient.loadPaymentData(request),
      activity,
      LOAD_PAYMENT_DATA_REQUEST_CODE);
  }

  @Override
  public void paymentRequestWithAndroidPay(@NonNull Map<String, Object> payParams, @NonNull Promise promise) {
    ArgCheck.nonNull(payParams);
    ArgCheck.nonNull(promise);

    Activity activity = activityProvider.call();
    if (activity == null) {
      promise.reject(TAG, NO_CURRENT_ACTIVITY_MSG);
      return;
    }

    this.payPromise = promise;
    startPaymentRequest(activity, createPaymentDataRequest(payParams));
  }

  @Override
  public void deviceSupportsAndroidPay(boolean isExistingPaymentMethodRequired, @NonNull Promise promise) {
    Activity activity = activityProvider.call();
    if (activity == null) {
      promise.reject(TAG, NO_CURRENT_ACTIVITY_MSG);
      return;
    }

    if (!isPlayServicesAvailable(activity)) {
      promise.reject(TAG, PLAY_SERVICES_ARE_NOT_AVAILABLE_MSG);
      return;
    }

    isReadyToPay(activity, isExistingPaymentMethodRequired, promise);
  }

  public boolean onActivityResult(int requestCode, int resultCode, Intent data) {
    if (payPromise == null) {
      return false;
    }

    switch (requestCode) {
      case LOAD_PAYMENT_DATA_REQUEST_CODE:
        switch (resultCode) {
          case Activity.RESULT_OK:
            PaymentData paymentData = PaymentData.getFromIntent(data);
            ArgCheck.nonNull(paymentData);
            String tokenJson = paymentData.getPaymentMethodToken().getToken();
            Token token = Token.fromString(tokenJson);
            if (token == null) {
              payPromise.reject(TAG, JSON_PARSING_ERROR_MSG);
            } else {
              payPromise.resolve(putExtraToTokenMap(
                convertTokenToWritableMap(token),
                getBillingAddress(paymentData),
                paymentData.getShippingAddress()));
            }
            break;
          case Activity.RESULT_CANCELED:
            payPromise.reject(TAG, PURCHASE_CANCELLED_MSG);
            break;
          case AutoResolveHelper.RESULT_ERROR:
            Status status = AutoResolveHelper.getStatusFromIntent(data);
            // Log the status for debugging.
            // Generally, there is no need to show an error to
            // the user as the Google Pay API will do that.
            payPromise.reject(TAG, status.getStatusMessage());
            break;

          default:
            // Do nothing.
        }
        payPromise = null;
        return true;
    }

    return false;
  }

}
