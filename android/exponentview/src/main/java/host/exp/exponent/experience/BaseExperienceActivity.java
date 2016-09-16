// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.support.v4.content.ContextCompat;
import android.util.Pair;
import android.view.View;
import android.widget.FrameLayout;

import com.facebook.drawee.backends.pipeline.Fresco;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;

import org.json.JSONObject;

import java.util.LinkedList;
import java.util.Queue;

import javax.inject.Inject;

import de.greenrobot.event.EventBus;
import host.exp.exponent.gcm.RegistrationIntentService;
import host.exp.exponentview.BuildConfig;
import host.exp.exponent.LoadingView;
import host.exp.exponentview.Exponent;
import host.exp.exponentview.R;
import host.exp.exponent.RNObject;
import host.exp.exponent.kernel.ExponentError;
import host.exp.exponent.kernel.ExponentErrorMessage;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.modules.ExponentKernelModule;
import host.exp.exponent.storage.ExponentSharedPreferences;

public abstract class BaseExperienceActivity extends ReactNativeActivity {

  public static class ExperienceDoneLoadingEvent {
  }

  private static final long VIEW_TEST_INTERVAL_MS = 20;

  private static BaseExperienceActivity sVisibleActivity;
  protected static Queue<ExponentError> sErrorQueue = new LinkedList<>();

  protected RNObject mReactRootView = new RNObject("com.facebook.react.ReactRootView");

  private FrameLayout mLayout;
  private FrameLayout mContainer;
  private LoadingView mLoadingView;
  private boolean mIsInForeground = false;
  private Handler mHandler = new Handler();
  private Handler mLoadingHandler = new Handler();
  private boolean mIsLoading = true;

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
    mLayout = new FrameLayout(this);
    setContentView(mLayout);

    mContainer = new FrameLayout(this);
    mContainer.setBackgroundColor(ContextCompat.getColor(this, R.color.white));
    mLoadingView = new LoadingView(this);
    mLayout.addView(mContainer);
    mLayout.addView(mLoadingView);

    Exponent.di().inject(this);
  }

  @Override
  protected void onResume() {
    super.onResume();
    mKernel.setActivityContext(this);

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

  protected boolean isInForeground() {
    return mIsInForeground;
  }

  protected void setIsInForeground(boolean isInForeground) {
    mIsInForeground = isInForeground;
  }

  @Override
  protected void onDestroy() {
    super.onDestroy();

    if (this instanceof HomeActivity) {
      // Don't want to trash the kernel instance
      return;
    }

    if (mReactInstanceManager.isNotNull()) {
      mReactInstanceManager.onHostDestroy();
      mReactInstanceManager.assign(null);
    }
    mReactRootView.assign(null);
    mHandler.removeCallbacksAndMessages(null);
    mLoadingHandler.removeCallbacksAndMessages(null);

    // Fresco leaks ReactApplicationContext
    Fresco.initialize(getApplicationContext());

    // TODO: OkHttpClientProvider leaks Activity. Clean it up.
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    Exponent.getInstance().onActivityResult(requestCode, resultCode, data);
  }

  protected void setView(final View view) {
    mContainer.removeAllViews();
    addView(view);
    checkForReactViews();
  }

  protected void addView(final View view) {
    removeViewFromParent(view);
    mContainer.addView(view);
  }

  protected void removeViewFromParent(final View view) {
    if (view.getParent() != null) {
      ((FrameLayout) view.getParent()).removeView(view);
    }
  }

  protected void removeViews() {
    mContainer.removeAllViews();
  }

  // Loop until a view is added to the React root view.
  private void checkForReactViews() {
    if (mReactRootView.isNull()) {
      return;
    }

    if ((int) mReactRootView.call("getChildCount") > 0) {
      fadeLoadingScreen();
      onDoneLoading();
    } else {
      mHandler.postDelayed(new Runnable() {
        @Override
        public void run() {
          checkForReactViews();
        }
      }, VIEW_TEST_INTERVAL_MS);
    }
  }

  public void showLoadingScreen(JSONObject manifest) {
    // Start of by not showing the icon since it hopefully won't take long.
    // If it takes more than 3 seconds start flashing the icon so it doesn't look like it's frozen.
    mLoadingView.setManifest(manifest);
    mLoadingView.setShowIcon(false);
    mLoadingHandler.postDelayed(new Runnable() {
      @Override
      public void run() {
        mLoadingView.setShowIcon(true);
      }
    }, 3000);
    mLoadingView.clearAnimation();
    mLoadingView.setAlpha(1.0f);
    mIsLoading = true;
  }

  public void showLongLoadingScreen(JSONObject manifest) {
    mLoadingView.setManifest(manifest);
    mLoadingView.setShowIcon(true);
    mLoadingView.clearAnimation();
    mLoadingView.setAlpha(1.0f);
    mIsLoading = true;
  }

  public boolean isLoading() {
    return mIsLoading;
  }

  private void fadeLoadingScreen() {
    runOnUiThread(new Runnable() {
      @Override
      public void run() {
        mLoadingView.setAlpha(0.0f);
        mLoadingView.setShowIcon(false);
        mLoadingView.setDoneLoading();
        mIsLoading = false;
        mLoadingHandler.removeCallbacksAndMessages(null);

        EventBus.getDefault().post(new ExperienceDoneLoadingEvent());
      }
    });
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
    return mExponentSharedPreferences.isDebugModeEnabled();
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

  // Override
  protected void onDoneLoading() {

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
