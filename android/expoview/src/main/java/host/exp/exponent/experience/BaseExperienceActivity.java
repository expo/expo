// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.content.Intent;
import android.content.res.Configuration;
import android.os.Bundle;
import android.util.Pair;

import com.facebook.drawee.backends.pipeline.Fresco;

import javax.inject.Inject;

import de.greenrobot.event.EventBus;
import host.exp.exponent.Constants;
import host.exp.exponent.RNObject;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.kernel.ExponentError;
import host.exp.exponent.kernel.ExponentErrorMessage;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.utils.AsyncCondition;
import host.exp.expoview.Exponent;

public abstract class BaseExperienceActivity extends MultipleVersionReactNativeActivity {
  private static String TAG = BaseExperienceActivity.class.getSimpleName();

  private static abstract class ExperienceEvent {
    private ExperienceKey mExperienceKey;

    ExperienceEvent(ExperienceKey experienceKey) {
      this.mExperienceKey = experienceKey;
    }

    public ExperienceKey getExperienceKey() {
      return mExperienceKey;
    }
  }

  public static class ExperienceForegroundedEvent extends ExperienceEvent {
    ExperienceForegroundedEvent(ExperienceKey experienceKey) {
      super(experienceKey);
    }
  }

  public static class ExperienceBackgroundedEvent extends ExperienceEvent {
    ExperienceBackgroundedEvent(ExperienceKey experienceKey) {
      super(experienceKey);
    }
  }

  public static class ExperienceContentLoaded extends ExperienceEvent {
    public ExperienceContentLoaded(ExperienceKey experienceKey) {
      super(experienceKey);
    }
  }

  private static BaseExperienceActivity sVisibleActivity;

  @Inject
  protected Kernel mKernel;

  private long mOnResumeTime;

  public static void addError(ExponentError error) {
    sErrorQueue.add(error);

    if (sVisibleActivity != null) {
      sVisibleActivity.consumeErrorQueue();
    } else if (ErrorActivity.getVisibleActivity() != null) {
      // If ErrorActivity is already started and we get another error from RN.
      sendErrorsToErrorActivity();
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

    mOnResumeTime = System.currentTimeMillis();
    AsyncCondition.wait(KernelConstants.EXPERIENCE_ID_SET_FOR_ACTIVITY_KEY, new AsyncCondition.AsyncConditionListener() {
      @Override
      public boolean isReady() {
        return mExperienceKey != null || BaseExperienceActivity.this instanceof HomeActivity;
      }

      @Override
      public void execute() {
        EventBus.getDefault().post(new ExperienceForegroundedEvent(mExperienceKey));
      }
    });
  }

  @Override
  protected void onPause() {
    EventBus.getDefault().post(new ExperienceBackgroundedEvent(mExperienceKey));
    super.onPause();

    // For some reason onPause sometimes gets called soon after onResume.
    // One symptom of this is that ReactNativeActivity.startReactInstance will
    // see isInForeground == false and not start the app.
    // 500ms should be very safe. The average time between onResume and
    // onPause when the bug happens is around 10ms.
    // This seems to happen when foregrounding the app after pressing on a notification.
    // Unclear if this is because of something we're doing during the initialization process
    // or just an OS quirk.
    long timeSinceOnResume = System.currentTimeMillis() - mOnResumeTime;
    if (timeSinceOnResume > 500) {
      mIsInForeground = false;
      if (sVisibleActivity == this) {
        sVisibleActivity = null;
      }
    }
  }

  @Override
  public void onBackPressed() {
    if (mReactInstanceManager != null && mReactInstanceManager.isNotNull() && !mIsCrashed) {
      mReactInstanceManager.call("onBackPressed");
    } else {
      moveTaskToBack(true);
    }
  }

  @Override
  public void invokeDefaultOnBackPressed() {
    moveTaskToBack(true);
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

  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);

    if (mReactInstanceManager != null && mReactInstanceManager.isNotNull() && !mIsCrashed) {
      mReactInstanceManager.call("onConfigurationChanged", this, newConfig);
    }
  }

  protected void consumeErrorQueue() {
    if (sErrorQueue.isEmpty()) {
      return;
    }

    runOnUiThread(() -> {
      if (sErrorQueue.isEmpty()) {
        return;
      }

      Pair<Boolean, ExponentErrorMessage> result = sendErrorsToErrorActivity();
      boolean isFatal = result.first;
      ExponentErrorMessage errorMessage = result.second;

      if (!shouldShowErrorScreen(errorMessage)) {
        return;
      }

      if (!isFatal) {
        return;
      }

      // we don't ever want to show any Expo UI in a production standalone app
      // so hard crash in this case
      if (Constants.isStandaloneApp() && !isDebugModeEnabled()) {
        throw new RuntimeException("Expo encountered a fatal error: " + errorMessage.developerErrorMessage());
      }

      if (!isDebugModeEnabled()) {
        removeAllViewsFromContainer();
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

      EventBus.getDefault().post(new ExperienceDoneLoadingEvent(this));
    });
  }

  private static Pair<Boolean, ExponentErrorMessage> sendErrorsToErrorActivity() {
    boolean isFatal = false;
    ExponentErrorMessage errorMessage = ExponentErrorMessage.developerErrorMessage("");

    synchronized (sErrorQueue) {
      while (!sErrorQueue.isEmpty()) {
        ExponentError error = sErrorQueue.remove();
        ErrorActivity.addError(error);

        // Just use the last error message for now, is there a better way to do this?
        errorMessage = error.errorMessage;
        if (error.isFatal) {
          isFatal = true;
        }
      }
    }

    return new Pair<>(isFatal, errorMessage);
  }

  // Override
  public boolean isDebugModeEnabled() {
    return false;
  }

  // Override
  protected void onError(final Intent intent) {
    // Modify intent used to start ErrorActivity
  }
}
