// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Pair;

import com.facebook.drawee.backends.pipeline.Fresco;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;

import java.util.LinkedList;
import java.util.Queue;

import javax.inject.Inject;

import de.greenrobot.event.EventBus;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.gcm.RegistrationIntentService;
import host.exp.exponentview.BuildConfig;
import host.exp.exponentview.Exponent;
import host.exp.exponent.RNObject;
import host.exp.exponent.kernel.ExponentError;
import host.exp.exponent.kernel.ExponentErrorMessage;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.modules.ExponentKernelModule;
import host.exp.exponent.storage.ExponentSharedPreferences;

public abstract class BaseExperienceActivity extends MultipleVersionReactNativeActivity {

  private static BaseExperienceActivity sVisibleActivity;
  protected static Queue<ExponentError> sErrorQueue = new LinkedList<>();

  @Inject
  Kernel mKernel;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  public static void addError(ExponentError error) {
    sErrorQueue.add(error);

    if (sVisibleActivity != null) {
      sVisibleActivity.consumeErrorQueue();
    } else if (ErrorActivity.getVisibleActivity() != null) {
      // If ErrorActivity is already started and we get another error from RN.
      sendErrorsToJS();
    }

    // Otherwise onResume will consumeErrorQueue
  }

  // TODO: kill. just use Exponent class's activity
  public static BaseExperienceActivity getVisibleActivity() {
    return sVisibleActivity;
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    mIsInForeground = true;
    mReactRootView = new RNObject("com.facebook.react.ReactRootView");

    NativeModuleDepsProvider.getInstance().inject(BaseExperienceActivity.class, this);
  }

  @Override
  protected void onResume() {
    super.onResume();
    mKernel.setActivityContext(this);
    Exponent.getInstance().setCurrentActivity(this);

    sVisibleActivity = this;

    // Consume any errors that happened before onResume
    consumeErrorQueue();
    mIsInForeground = true;
  }

  @Override
  protected void onPause() {
    super.onPause();

    mIsInForeground = false;
    if (sVisibleActivity == this) {
      sVisibleActivity = null;
    }
  }

  @Override
  public void onBackPressed() {
    if (mReactInstanceManager.isNotNull() && !mIsCrashed) {
      mReactInstanceManager.call("onBackPressed");
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      moveTaskToBack(true);
    } else {
      invokeDefaultOnBackPressed();
    }
  }

  @Override
  public void invokeDefaultOnBackPressed() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      moveTaskToBack(true);
    } else {
      super.invokeDefaultOnBackPressed();
    }
  }

  @Override
  protected void onDestroy() {
    super.onDestroy();

    if (this instanceof HomeActivity) {
      // Don't want to trash the kernel instance
      return;
    }

    if (mReactInstanceManager != null && mReactInstanceManager.isNotNull()) {
      mReactInstanceManager.onHostDestroy();
      mReactInstanceManager.assign(null);
    }
    mReactRootView.assign(null);

    // Fresco leaks ReactApplicationContext
    Fresco.initialize(getApplicationContext());

    // TODO: OkHttpClientProvider leaks Activity. Clean it up.
  }

  protected void consumeErrorQueue() {
    if (sErrorQueue.isEmpty()) {
      return;
    }

    runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if (sErrorQueue.isEmpty()) {
          return;
        }

        Pair<Boolean, ExponentErrorMessage> result = sendErrorsToJS();
        boolean isFatal = result.first;
        ExponentErrorMessage errorMessage = result.second;

        if (!shouldShowErrorScreen(errorMessage)) {
          return;
        }

        if (!isFatal) {
          return;
        }

        if (!isDebugModeEnabled()) {
          removeViews();
          mReactInstanceManager.assign(null);
          mReactRootView.assign(null);
        }

        mIsCrashed = true;
        mIsLoading = false;

        Intent intent = new Intent(BaseExperienceActivity.this, ErrorActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        onError(intent);
        intent.putExtra(ErrorActivity.DEBUG_MODE_KEY, isDebugModeEnabled());
        intent.putExtra(ErrorActivity.USER_ERROR_MESSAGE_KEY, errorMessage.userErrorMessage());
        intent.putExtra(ErrorActivity.DEVELOPER_ERROR_MESSAGE_KEY, errorMessage.developerErrorMessage());
        startActivity(intent);

        EventBus.getDefault().post(new ExperienceDoneLoadingEvent());
      }
    });
  }

  private static Pair<Boolean, ExponentErrorMessage> sendErrorsToJS() {
    boolean isFatal = false;
    ExponentErrorMessage errorMessage = ExponentErrorMessage.developerErrorMessage("");

    while (!sErrorQueue.isEmpty()) {
      ExponentError error = sErrorQueue.remove();
      ExponentKernelModule.addError(error);
      if (sVisibleActivity != null) {
        sVisibleActivity.onError(error);
      }

      // Just use the last error message for now, is there a better way to do this?
      errorMessage = error.errorMessage;
      if (error.isFatal) {
        isFatal = true;
      }
    }

    return new Pair<>(isFatal, errorMessage);
  }

  // Override
  public boolean isDebugModeEnabled() {
    return false;
  }

  // Override
  protected boolean shouldShowErrorScreen(ExponentErrorMessage errorMessage) {
    return true;
  }

  // Override
  protected void onError(final Intent intent) {
    // Modify intent used to start ErrorActivity
  }

  // Override
  protected void onError(final ExponentError error) {
    // Called for each JS error
  }

  protected void registerForNotifications() {
    int googlePlayServicesCode = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(this);
    if (googlePlayServicesCode == ConnectionResult.SUCCESS) {
      Intent intent = new Intent(this, RegistrationIntentService.class);
      startService(intent);
    } else if (!BuildConfig.DEBUG) {
      // TODO: should we actually show an error or fail silently?
      // GoogleApiAvailability.getInstance().getErrorDialog(this, googlePlayServicesCode, 0).show();
    }
  }

  @Override
  public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
    Exponent.getInstance().onRequestPermissionsResult(requestCode, permissions, grantResults);
  }
}
