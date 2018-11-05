// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.localauthentication;

import android.content.Context;
import android.hardware.fingerprint.FingerprintManager;
import android.os.Bundle;
import android.support.v4.hardware.fingerprint.FingerprintManagerCompat;
import android.support.v4.os.CancellationSignal;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.UIManager;

public class LocalAuthenticationModule extends ExportedModule implements ModuleRegistryConsumer {
  private final FingerprintManagerCompat mFingerprintManager;
  private CancellationSignal mCancellationSignal;
  private Promise mPromise;
  private boolean mIsAuthenticating = false;
  private UIManager mUIManager;

  private final FingerprintManagerCompat.AuthenticationCallback mAuthenticationCallback =
      new FingerprintManagerCompat.AuthenticationCallback() {
        @Override
        public void onAuthenticationSucceeded(FingerprintManagerCompat.AuthenticationResult result) {
          mIsAuthenticating = false;
          Bundle successResult = new Bundle();
          successResult.putBoolean("success", true);
          safeResolve(successResult);
        }

        @Override
        public void onAuthenticationFailed() {
          mIsAuthenticating = false;
          Bundle failResult = new Bundle();
          failResult.putBoolean("success", false);
          failResult.putString("error", "authentication_failed");
          safeResolve(failResult);
          // Failed authentication doesn't stop the authentication process, stop it anyway so it works
          // with the promise API.
          safeCancel();
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

        @Override
        public void onAuthenticationHelp(int helpMsgId, CharSequence helpString) {
          mIsAuthenticating = false;
          Bundle helpResult = new Bundle();
          helpResult.putBoolean("success", false);
          helpResult.putString("error", convertHelpCode(helpMsgId));
          helpResult.putString("message", helpString.toString());
          safeResolve(helpResult);
          // Help doesn't stop the authentication process, stop it anyway so it works with the
          // promise API.
          safeCancel();
        }
      };

  public LocalAuthenticationModule(Context context) {
    super(context);

    mFingerprintManager = FingerprintManagerCompat.from(context);
  }

  @Override
  public String getName() {
    return "ExpoLocalAuthentication";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mUIManager = moduleRegistry.getModule(UIManager.class);
  }

  @ExpoMethod
  public void hasHardwareAsync(final Promise promise) {
    boolean hasHardware = mFingerprintManager.isHardwareDetected();
    promise.resolve(hasHardware);
  }

  @ExpoMethod
  public void isEnrolledAsync(final Promise promise) {
    boolean isEnrolled = mFingerprintManager.hasEnrolledFingerprints();
    promise.resolve(isEnrolled);
  }

  @ExpoMethod
  public void authenticateAsync(final Promise promise) {
    // FingerprintManager callbacks are invoked on the main thread so also run this there to avoid
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
        mFingerprintManager.authenticate(null, 0, mCancellationSignal, mAuthenticationCallback, null);
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
      case FingerprintManager.FINGERPRINT_ERROR_CANCELED:
        return "user_cancel";
      case FingerprintManager.FINGERPRINT_ERROR_HW_UNAVAILABLE:
        return "not_available";
      case FingerprintManager.FINGERPRINT_ERROR_LOCKOUT:
        return "lockout";
      case FingerprintManager.FINGERPRINT_ERROR_NO_SPACE:
        return "no_space";
      case FingerprintManager.FINGERPRINT_ERROR_TIMEOUT:
        return "timeout";
      case FingerprintManager.FINGERPRINT_ERROR_UNABLE_TO_PROCESS:
        return "unable_to_process";
      default:
        return "unknown";
    }
  }

  private static String convertHelpCode(int code) {
    switch (code) {
      case FingerprintManager.FINGERPRINT_ACQUIRED_IMAGER_DIRTY:
        return "imager_dirty";
      case FingerprintManager.FINGERPRINT_ACQUIRED_INSUFFICIENT:
        return "insufficient";
      case FingerprintManager.FINGERPRINT_ACQUIRED_PARTIAL:
        return "partial";
      case FingerprintManager.FINGERPRINT_ACQUIRED_TOO_FAST:
        return "too_fast";
      case FingerprintManager.FINGERPRINT_ACQUIRED_TOO_SLOW:
        return "too_slow";
      default:
        return "unknown";
    }
  }
}
