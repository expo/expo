// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageButton;
import android.widget.TextView;

import javax.inject.Inject;

import com.amplitude.api.Amplitude;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;

import org.json.JSONException;
import org.json.JSONObject;

import de.greenrobot.event.EventBus;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.Constants;
import host.exp.exponent.LauncherActivity;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponentview.Exponent;
import host.exp.exponentview.R;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.utils.JSONBundleConverter;

public class ErrorActivity extends MultipleVersionReactNativeActivity {

  private static final String TAG = ErrorActivity.class.getSimpleName();

  public static final String IS_HOME_KEY = "isHome";
  public static final String MANIFEST_URL_KEY = "manifestUrl";
  public static final String USER_ERROR_MESSAGE_KEY = "userErrorMessage";
  public static final String DEVELOPER_ERROR_MESSAGE_KEY = "developerErrorMessage";
  public static final String DEBUG_MODE_KEY = "isDebugModeEnabled";

  private static final String ERROR_MODULE_NAME = "ErrorScreenApp";

  private static ErrorActivity sVisibleActivity;

  TextView mErrorMessageView;
  View mHomeButton;
  ImageButton mReloadButton;

  private boolean mShouldShowJSErrorScreen;
  private String mManifestUrl;
  private ReactRootView mReactRootView;
  private String mUserErrorMessage;
  private String mDeveloperErrorMessage;
  private String mDefaultErrorMessage;
  private boolean mIsShellApp;

  @Inject
  Kernel mKernel;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  public static ErrorActivity getVisibleActivity() {
    return sVisibleActivity;
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    mShouldDestroyRNInstanceOnExit = false;

    setContentView(R.layout.error_activity);
    mErrorMessageView = (TextView) findViewById(R.id.error_message);
    mHomeButton = findViewById(R.id.home_button);
    mReloadButton = (ImageButton) findViewById(R.id.reload_button);
    mHomeButton.setOnClickListener(new View.OnClickListener() {
      @Override
      public void onClick(View v) {
        onClickHome();
      }
    });
    mReloadButton.setOnClickListener(new View.OnClickListener() {
      @Override
      public void onClick(View v) {
        onClickReload();
      }
    });

    NativeModuleDepsProvider.getInstance().inject(ErrorActivity.class, this);

    ExperienceActivity.removeNotification(this);

    Bundle bundle = getIntent().getExtras();
    mUserErrorMessage = bundle.getString(USER_ERROR_MESSAGE_KEY);
    mDeveloperErrorMessage = bundle.getString(DEVELOPER_ERROR_MESSAGE_KEY);
    mDefaultErrorMessage = mUserErrorMessage;
    if (mDefaultErrorMessage == null || mDefaultErrorMessage.length() == 0) {
      mDefaultErrorMessage = mDeveloperErrorMessage;
    }
    Boolean isDebugModeEnabled = bundle.getBoolean(DEBUG_MODE_KEY);
    mManifestUrl = bundle.getString(MANIFEST_URL_KEY);
    boolean isHomeError = bundle.getBoolean(IS_HOME_KEY, false);
    mIsShellApp = mManifestUrl != null && mManifestUrl.equals(Constants.INITIAL_URL);
    mShouldShowJSErrorScreen = mKernel.isRunning();

    try {
      JSONObject eventProperties = new JSONObject();
      eventProperties.put(Analytics.USER_ERROR_MESSAGE, mUserErrorMessage);
      eventProperties.put(Analytics.DEVELOPER_ERROR_MESSAGE, mDeveloperErrorMessage);
      eventProperties.put(Analytics.MANIFEST_URL, mManifestUrl);
      Amplitude.getInstance().logEvent(Analytics.ERROR_SCREEN, eventProperties);
    } catch (Exception e) {
      EXL.e(TAG, e.getMessage());
    }

    if (isHomeError || mManifestUrl == null || mManifestUrl.equals(Constants.INITIAL_URL)) {
      // Kernel is probably dead.
      mHomeButton.setVisibility(View.GONE);
      mErrorMessageView.setText(mDefaultErrorMessage);
    } else {
      if (mShouldShowJSErrorScreen) {
        // Show JS error screen.
        if (!isDebugModeEnabled) {
          mErrorMessageView.setText(this.getString(R.string.error_unable_to_load_experience));
        }
      } else {
        mErrorMessageView.setText(mDefaultErrorMessage);
      }
    }

    EventBus.getDefault().registerSticky(this);
    EXL.e(TAG, "ErrorActivity message: " + mDefaultErrorMessage);

    if (!mKernel.isStarted()) {
      // Might not be started if the Experience crashed immediately.
      // ONLY start it if it hasn't been started already, don't want to retry immediately
      // if there was an error in the kernel.
      mKernel.startJSKernel();
    }
  }

  @Override
  protected void onResume() {
    super.onResume();

    sVisibleActivity = this;
    Analytics.logEventWithManifestUrl(Analytics.ERROR_APPEARED, mManifestUrl);
  }

  @Override
  protected void onPause() {
    super.onPause();

    if (sVisibleActivity == this) {
      sVisibleActivity = null;
    }
  }

  @Override
  protected void onDestroy() {
    super.onDestroy();
    EventBus.getDefault().unregister(this);
  }

  public void onEventMainThread(Kernel.KernelStartedRunningEvent event) {
    if (!mKernel.isRunning()) {
      return;
    }

    JSONObject props = new JSONObject();
    try {
      props.put("isShellApp", mIsShellApp);
      props.put("userErrorMessage", mUserErrorMessage);
      props.put("developerErrorMessage", mDeveloperErrorMessage);
    } catch (JSONException e) {
      EXL.e(TAG, e);
    }
    Bundle bundle = JSONBundleConverter.JSONToBundle(props);

    mReactInstanceManager.assign(mKernel.getReactInstanceManager());
    mReactRootView = new ReactRootView(this);
    mReactRootView.startReactApplication(
        (ReactInstanceManager) mReactInstanceManager.get(),
        ERROR_MODULE_NAME,
        bundle
    );
    mReactInstanceManager.onHostResume(this, this);
    setContentView(mReactRootView);
  }

  @Override
  public void onBackPressed() {
    if (mReactInstanceManager.isNotNull() && !mIsCrashed) {
      mReactInstanceManager.call("onBackPressed");
    } else {
      mKernel.killActivityStack(this);
    }
  }

  @Override
  public void invokeDefaultOnBackPressed() {
    mKernel.killActivityStack(this);
  }

  public void onClickHome() {
    if (!mKernel.isRunning()) {
      mKernel.reloadJSBundle();
    }

    Intent intent = new Intent(this, LauncherActivity.class);
    startActivity(intent);

    // Mark as not visible so that any new errors go to a new activity.
    if (sVisibleActivity == this) {
      sVisibleActivity = null;
    }

    mKernel.killActivityStack(this);
  }

  public void onClickReload() {
    if (!mKernel.isRunning()) {
      mKernel.reloadJSBundle();
    }

    if (mManifestUrl != null) {
      mKernel.reloadVisibleExperience(mManifestUrl);

      // Mark as not visible so that any new errors go to a new activity.
      if (sVisibleActivity == this) {
        sVisibleActivity = null;
      }

      mKernel.killActivityStack(this);
    } else {
      // Mark as not visible so that any new errors go to a new activity.
      if (sVisibleActivity == this) {
        sVisibleActivity = null;
      }

      finish();
    }
  }
}
