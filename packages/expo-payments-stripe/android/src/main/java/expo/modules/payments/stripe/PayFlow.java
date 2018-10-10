package expo.modules.payments.stripe;

import android.app.Activity;
import android.content.Intent;
import android.support.annotation.NonNull;
import android.util.Log;

import expo.core.Promise;
import expo.modules.payments.stripe.util.ArgCheck;
import expo.modules.payments.stripe.util.Fun0;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.wallet.WalletConstants;

import java.util.Map;

public abstract class PayFlow {

  public static final String NO_CURRENT_ACTIVITY_MSG = "Cannot start process with no current activity";
  public static final String PURCHASE_CANCELLED_MSG = "Purchase was cancelled";
  public static final String PURCHASE_LOAD_MASKED_WALLET_ERROR_MSG = "Purchase masked wallet error";
  public static final String PURCHASE_LOAD_FULL_WALLET_ERROR_MSG = "Purchase full wallet error";
  public static final String ANDROID_PAY_UNAVAILABLE_ERROR_MSG = "Android Pay is unavailable";
  public static final String MAKING_IS_READY_TO_PAY_CALL_ERROR_MSG = "Error making isReadyToPay call";
  public static final String JSON_PARSING_ERROR_MSG = "Failed to create token from JSON string";
  public static final String PLAY_SERVICES_ARE_NOT_AVAILABLE_MSG = "Play services are not available!";

  protected final @NonNull Fun0<Activity> activityProvider;
  private String publishableKey; // invalid value by default
  private int environment; // invalid value by default


  public PayFlow(@NonNull Fun0<Activity> activityProvider) {
    ArgCheck.nonNull(activityProvider);
    this.activityProvider = activityProvider;
  }

  public static PayFlow create(Fun0<Activity> activityProvider) {
    return new GoogleApiPayFlowImpl(activityProvider);
  }

  private static boolean isValidEnvironment(int environment) {
    return environment == WalletConstants.ENVIRONMENT_TEST ||
      environment == WalletConstants.ENVIRONMENT_PRODUCTION;
  }

  private static boolean isEnvironmentChangeAttempt(int oldEnvironment, int newEnvironment) {
    return oldEnvironment != newEnvironment && isValidEnvironment(oldEnvironment) &&
      isValidEnvironment(newEnvironment);
  }

  protected int getEnvironment() {
    ArgCheck.isTrue(isValidEnvironment(environment));

    return environment;
  }

  public void setEnvironment(int environment) {
    ArgCheck.isTrue(isValidEnvironment(environment));
    ArgCheck.isTrue(!isEnvironmentChangeAttempt(this.environment, environment));

    this.environment = environment;
  }

  protected String getPublishableKey() {
    return ArgCheck.notEmptyString(publishableKey);
  }

  public void setPublishableKey(@NonNull String publishableKey) {
    this.publishableKey = ArgCheck.notEmptyString(publishableKey);
  }

  abstract void paymentRequestWithAndroidPay(final Map<String, Object> payParams, final Promise promise);

  abstract void deviceSupportsAndroidPay(boolean isExistingPaymentMethodRequired, final Promise promise);

  abstract boolean onActivityResult(int requestCode, int resultCode, Intent data);

  public static boolean isPlayServicesAvailable(@NonNull Activity activity) {
    ArgCheck.nonNull(activity);

    GoogleApiAvailability googleAPI = GoogleApiAvailability.getInstance();
    int result = googleAPI.isGooglePlayServicesAvailable(activity);

    return result == ConnectionResult.SUCCESS;
  }

  protected static void log(String TAG, String msg) {
    if (BuildConfig.DEBUG) {
      Log.d(TAG, msg);
    }
  }
}
