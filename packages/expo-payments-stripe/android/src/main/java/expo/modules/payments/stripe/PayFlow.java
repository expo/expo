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

  protected final @NonNull Fun0<Activity> activityProvider;
  private String publishableKey; // invalid value by default
  private int environment; // invalid value by default
  private Map<String, Object> errorCodes; // invalid value by default, set in runtime


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

  public void setErrorCodes(Map<String, Object> errorCodes) {
    if (this.errorCodes == null) {
      this.errorCodes = errorCodes;
    }
  }
  protected Map<String, Object> getErrorCodes() {
    return ArgCheck.nonNull(errorCodes);
  }
  protected String getErrorCode(String key) {
    return Errors.getErrorCode(getErrorCodes(), key);
  }
  protected String getErrorDescription(String key) {
    return Errors.getDescription(getErrorCodes(), key);
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
