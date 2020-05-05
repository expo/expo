// Copyright 2015-present 650 Industries. All rights reserved.

package abi37_0_0.expo.modules.localauthentication;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import androidx.core.os.CancellationSignal;

import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.fragment.app.FragmentActivity;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import abi37_0_0.org.unimodules.core.ExportedModule;
import abi37_0_0.org.unimodules.core.ModuleRegistry;
import abi37_0_0.org.unimodules.core.Promise;
import abi37_0_0.org.unimodules.core.interfaces.ActivityProvider;
import abi37_0_0.org.unimodules.core.interfaces.ExpoMethod;
import abi37_0_0.org.unimodules.core.interfaces.services.UIManager;

public class LocalAuthenticationModule extends ExportedModule {
  private final BiometricManager mBiometricManager;
  private CancellationSignal mCancellationSignal;
  private Promise mPromise;
  private boolean mIsAuthenticating = false;
  private ModuleRegistry mModuleRegistry;
  private UIManager mUIManager;

  private static final int AUTHENTICATION_TYPE_FINGERPRINT = 1;

  private final BiometricPrompt.AuthenticationCallback mAuthenticationCallback =
          new BiometricPrompt.AuthenticationCallback () {
            @Override
            public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
              mIsAuthenticating = false;
              Bundle successResult = new Bundle();
              successResult.putBoolean("success", true);
              safeResolve(successResult);
            }

            @Override
            public void onAuthenticationError(int errMsgId, CharSequence errString) {
              mIsAuthenticating = false;
              Bundle errorResult = new Bundle();
              errorResult.putBoolean("success", false);
              errorResult.putString("error", convertErrorCode(errMsgId));
              errorResult.putString("message", errString.toString());
              safeResolve(errorResult);
            }
          };

  public LocalAuthenticationModule(Context context) {
    super(context);

    mBiometricManager = BiometricManager.from(context);
  }

  @Override
  public String getName() {
    return "ExpoLocalAuthentication";
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
    mUIManager = moduleRegistry.getModule(UIManager.class);
  }

  @ExpoMethod
  public void supportedAuthenticationTypesAsync(final Promise promise) {
    int result = mBiometricManager.canAuthenticate();
    List<Integer> results = new ArrayList<>();
    if (result != BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE) {
      results.add(AUTHENTICATION_TYPE_FINGERPRINT);
    }
    promise.resolve(results);
  }

  @ExpoMethod
  public void hasHardwareAsync(final Promise promise) {
    int result = mBiometricManager.canAuthenticate();
    promise.resolve(result != BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE);
  }

  @ExpoMethod
  public void isEnrolledAsync(final Promise promise) {
    int result = mBiometricManager.canAuthenticate();
    promise.resolve(result == BiometricManager.BIOMETRIC_SUCCESS);
  }

  @ExpoMethod
  public void authenticateAsync(final Promise promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      promise.reject("E_NOT_SUPPORTED", "Cannot display biometric prompt on android versions below 6.0");
      return;
    }

    if (getCurrentActivity() == null) {
      promise.reject("E_NOT_FOREGROUND", "Cannot display biometric prompt when the app is not in the foreground");
      return;
    }

    if (getKeyguardManager().isDeviceSecure() == false) {
      Bundle errorResult = new Bundle();
      errorResult.putBoolean("success", false);
      errorResult.putString("error", "not_enrolled");
      errorResult.putString("message", "KeyguardManager#isDeviceSecure() returned false");
      promise.resolve(errorResult);
      return;
    }

    // BiometricPrompt callbacks are invoked on the main thread so also run this there to avoid
    // having to do locking.
    mUIManager.runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        if (mIsAuthenticating) {
          Bundle cancelResult = new Bundle();
          cancelResult.putBoolean("success", false);
          cancelResult.putString("error", "app_cancel");
          safeResolve(cancelResult);
          mPromise = promise;
          return;
        }

        mIsAuthenticating = true;
        mPromise = promise;
        mCancellationSignal = new CancellationSignal();

        FragmentActivity fragmentActivity = (FragmentActivity) getCurrentActivity();
        Executor executor = Executors.newSingleThreadExecutor();
        BiometricPrompt biometricPrompt = new BiometricPrompt(fragmentActivity, executor, mAuthenticationCallback);

        BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                .setDeviceCredentialAllowed(true)
                .setTitle("Authenticate")
                .build();
        biometricPrompt.authenticate(promptInfo);
      }
    });
  }

  @ExpoMethod
  public void cancelAuthenticate(final Promise promise) {
    mUIManager.runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        safeCancel();
      }
    });
  }

  private void safeCancel() {
    if (mCancellationSignal != null) {
      mCancellationSignal.cancel();
      mCancellationSignal = null;
    }
  }

  private void safeResolve(Object result) {
    if (mPromise != null) {
      mPromise.resolve(result);
      mPromise = null;
    }
  }

  private static String convertErrorCode(int code) {
    switch (code) {
      case BiometricPrompt.ERROR_CANCELED:
      case BiometricPrompt.ERROR_NEGATIVE_BUTTON:
      case BiometricPrompt.ERROR_USER_CANCELED:
        return "user_cancel";
      case BiometricPrompt.ERROR_HW_NOT_PRESENT:
      case BiometricPrompt.ERROR_HW_UNAVAILABLE:
      case BiometricPrompt.ERROR_NO_BIOMETRICS:
      case BiometricPrompt.ERROR_NO_DEVICE_CREDENTIAL:
        return "not_available";
      case BiometricPrompt.ERROR_LOCKOUT:
      case BiometricPrompt.ERROR_LOCKOUT_PERMANENT:
        return "lockout";
      case BiometricPrompt.ERROR_NO_SPACE:
        return "no_space";
      case BiometricPrompt.ERROR_TIMEOUT:
        return "timeout";
      case BiometricPrompt.ERROR_UNABLE_TO_PROCESS:
        return "unable_to_process";
      default:
        return "unknown";
    }
  }

  private KeyguardManager getKeyguardManager() {
    return (KeyguardManager) getCurrentActivity().getApplicationContext().getSystemService(Context.KEYGUARD_SERVICE);
  }

  private Activity getCurrentActivity() {
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    return activityProvider != null ? activityProvider.getCurrentActivity() : null;
  }
}
