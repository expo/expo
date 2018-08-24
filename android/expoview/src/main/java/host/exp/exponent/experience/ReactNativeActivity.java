// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.provider.Settings;
import android.support.v4.app.FragmentActivity;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AlertDialog;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.devsupport.DoubleTapReloadRecognizer;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;

import javax.inject.Inject;

import de.greenrobot.event.EventBus;
import expo.core.interfaces.Package;
import host.exp.exponent.ABIVersion;
import host.exp.exponent.Constants;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.LoadingView;
import host.exp.exponent.RNObject;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.ExponentError;
import host.exp.exponent.kernel.ExponentErrorMessage;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.kernel.KernelProvider;
import host.exp.exponent.kernel.services.ErrorRecoveryManager;
import host.exp.exponent.kernel.services.ExpoKernelServiceRegistry;
import host.exp.exponent.kernel.services.SplashScreenKernelService;
import host.exp.exponent.notifications.ExponentNotification;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.utils.JSONBundleConverter;
import host.exp.expoview.Exponent;
import host.exp.expoview.R;

import static host.exp.exponent.kernel.KernelConstants.INTENT_URI_KEY;
import static host.exp.exponent.kernel.KernelConstants.LINKING_URI_KEY;
import static host.exp.exponent.kernel.KernelConstants.MANIFEST_URL_KEY;

public abstract class ReactNativeActivity extends FragmentActivity implements com.facebook.react.modules.core.DefaultHardwareBackBtnHandler {

  public static class ExperienceDoneLoadingEvent {
  }

  // Override
  public Bundle initialProps(Bundle expBundle) {
    return expBundle;
  }

  // Override
  protected void onDoneLoading() {

  }

  // Override
  // Will be called after waitForDrawOverOtherAppPermission
  protected void startReactInstance() {

  }

  private static final String TAG = ReactNativeActivity.class.getSimpleName();

  private static final long VIEW_TEST_INTERVAL_MS = 20;

  protected RNObject mReactInstanceManager = new RNObject("com.facebook.react.ReactInstanceManager");
  protected boolean mIsCrashed = false;
  protected boolean mShouldDestroyRNInstanceOnExit = true;

  protected String mManifestUrl;
  protected String mExperienceIdString;
  protected ExperienceId mExperienceId;
  protected String mSDKVersion;
  protected int mActivityId;

  // In detach we want UNVERSIONED most places. We still need the numbered sdk version
  // when creating cache keys.
  protected String mDetachSdkVersion;

  protected RNObject mReactRootView;
  private FrameLayout mLayout;
  private FrameLayout mContainer;
  private LoadingView mLoadingView;
  private Handler mHandler = new Handler();
  private Handler mLoadingHandler = new Handler();
  private DoubleTapReloadRecognizer mDoubleTapReloadRecognizer;
  private SplashScreenKernelService mSplashScreenKernelService;
  protected boolean mIsLoading = true;
  protected String mJSBundlePath;
  protected JSONObject mManifest;
  protected boolean mIsInForeground = false;
  protected static Queue<ExponentError> sErrorQueue = new LinkedList<>();

  @Inject
  protected ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  ExpoKernelServiceRegistry mExpoKernelServiceRegistry;

  public boolean isLoading() {
    return mIsLoading;
  }

  public boolean isInForeground() {
    return mIsInForeground;
  }

  public View getRootView() {
    if (mReactRootView == null) {
      return null;
    } else {
      return (View) mReactRootView.get();
    }
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    mLayout = new FrameLayout(this);
    setContentView(mLayout);

    mContainer = new FrameLayout(this);
    mLayout.addView(mContainer);
    mLoadingView = new LoadingView(this);
    if (!Constants.isShellApp() || Constants.SHOW_LOADING_VIEW_IN_SHELL_APP) {
      mContainer.setBackgroundColor(ContextCompat.getColor(this, R.color.white));
      mLayout.addView(mLoadingView);
    }

    mDoubleTapReloadRecognizer = new DoubleTapReloadRecognizer();
    Exponent.initialize(this, getApplication());
    NativeModuleDepsProvider.getInstance().inject(ReactNativeActivity.class, this);
    mSplashScreenKernelService = mExpoKernelServiceRegistry.getSplashScreenKernelService();

    // Can't call this here because subclasses need to do other initialization
    // before their listener methods are called.
    // EventBus.getDefault().registerSticky(this);
  }

  protected void setView(final View view) {
    mContainer.removeAllViews();
    if (Constants.isShellApp() && Constants.SHOW_LOADING_VIEW_IN_SHELL_APP) {
      ViewGroup.LayoutParams layoutParams = mContainer.getLayoutParams();
      layoutParams.height = 0;
      mContainer.setLayoutParams(layoutParams);
    }
    addView(view);
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

  protected void stopLoading() {
    if (!mIsLoading || !canHideLoadingScreen()) {
      return;
    }
    mHandler.removeCallbacksAndMessages(null);
    hideLoadingScreen();
  }

  protected void updateLoadingProgress(String status, Integer done, Integer total) {
    mLoadingView.updateProgress(status, done, total);
  }

  protected void removeViews() {
    mContainer.removeAllViews();
  }

  // Loop until a view is added to the React root view.
  protected void checkForReactViews() {
    if (mReactRootView.isNull()) {
      return;
    }

    if ((int) mReactRootView.call("getChildCount") > 0) {
      if (canHideLoadingScreen()) {
        fadeLoadingScreen();
      }
      onDoneLoading();
      ErrorRecoveryManager.getInstance(mExperienceId).markExperienceLoaded();

      pollForEventsToSendToRN();
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
    mLoadingView.setManifest(manifest);
    mLoadingView.setShowIcon(true);
    mLoadingView.clearAnimation();
    mLoadingView.setAlpha(1.0f);
    mIsLoading = true;
  }

  private void fadeLoadingScreen() {
    if (!mIsLoading) {
      return;
    }
    runOnUiThread(new Runnable() {
      @Override
      public void run() {
        hideLoadingScreen();
        EventBus.getDefault().post(new ExperienceDoneLoadingEvent());
      }
    });
  }

  private void hideLoadingScreen() {
    if (Constants.isShellApp() && Constants.SHOW_LOADING_VIEW_IN_SHELL_APP) {
      ViewGroup.LayoutParams layoutParams = mContainer.getLayoutParams();
      layoutParams.height = mLayout.getHeight();
      mContainer.setLayoutParams(layoutParams);
    }

    if (mLoadingView != null && mLoadingView.getParent() == mLayout) {
      mLoadingView.setAlpha(0.0f);
      mLoadingView.setShowIcon(false);
      mLoadingView.setDoneLoading();
    }

    mSplashScreenKernelService.reset();
    mIsLoading = false;
    mLoadingHandler.removeCallbacksAndMessages(null);
  }

  private boolean canHideLoadingScreen() {
    return (!mSplashScreenKernelService.isAppLoadingStarted() || mSplashScreenKernelService.isAppLoadingFinished()) && mSplashScreenKernelService.shouldAutoHide();
  }

  @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    if (mReactInstanceManager != null && mReactInstanceManager.isNotNull() && !mIsCrashed) {
      if (keyCode == KeyEvent.KEYCODE_MENU) {
        mReactInstanceManager.call("showDevOptionsDialog");
        return true;
      }
      RNObject devSupportManager = mReactInstanceManager.callRecursive("getDevSupportManager");
      if (devSupportManager != null && (boolean) devSupportManager.call("getDevSupportEnabled")) {
        boolean didDoubleTapR = Assertions.assertNotNull(mDoubleTapReloadRecognizer)
            .didDoubleTapR(keyCode, getCurrentFocus());
        if (didDoubleTapR) {
          // The loading screen is hidden by versioned code when reloading JS so we can't show it
          // on older sdks.
          if (ABIVersion.toNumber(mSDKVersion) >= ABIVersion.toNumber("26.0.0")) {
            showLoadingScreen(mManifest);
          }
          devSupportManager.call("handleReloadJS");
          return true;
        }
      }
    }
    return super.onKeyUp(keyCode, event);
  }

  @Override
  public void onBackPressed() {
    if (mReactInstanceManager != null && mReactInstanceManager.isNotNull() && !mIsCrashed) {
      mReactInstanceManager.call("onBackPressed");
    } else {
      super.onBackPressed();
    }
  }

  @Override
  public void invokeDefaultOnBackPressed() {
    super.onBackPressed();
  }

  @Override
  protected void onPause() {
    super.onPause();

    if (mReactInstanceManager != null && mReactInstanceManager.isNotNull() && !mIsCrashed) {
      mReactInstanceManager.onHostPause();
      // TODO: use onHostPause(activity)
    }
  }

  @Override
  protected void onResume() {
    super.onResume();

    if (mReactInstanceManager != null && mReactInstanceManager.isNotNull() && !mIsCrashed) {
      mReactInstanceManager.onHostResume(this, this);
    }
  }

  @Override
  protected void onDestroy() {
    super.onDestroy();

    if (mReactInstanceManager != null && mReactInstanceManager.isNotNull() && !mIsCrashed && mShouldDestroyRNInstanceOnExit) {
      mReactInstanceManager.call("destroy");
    }

    mHandler.removeCallbacksAndMessages(null);
    mLoadingHandler.removeCallbacksAndMessages(null);
    EventBus.getDefault().unregister(this);
  }

  @Override
  public void onNewIntent(Intent intent) {
    if (mReactInstanceManager != null && mReactInstanceManager.isNotNull() && !mIsCrashed) {
      try {
        mReactInstanceManager.call("onNewIntent", intent);
      } catch (Throwable e) {
        EXL.e(TAG, e.toString());
        super.onNewIntent(intent);
      }
    } else {
      super.onNewIntent(intent);
    }
  }

  public boolean isDebugModeEnabled() {
    return ExponentManifest.isDebugModeEnabled(mManifest);
  }

  protected void waitForDrawOverOtherAppPermission(String jsBundlePath) {
    mJSBundlePath = jsBundlePath;

    if (isDebugModeEnabled() && Exponent.getInstance().shouldRequestDrawOverOtherAppsPermission()) {
      new AlertDialog.Builder(this)
          .setTitle("Please enable \"Permit drawing over other apps\"")
          .setMessage("Click \"ok\" to open settings. Press the back button once you've enabled the setting.")
          .setPositiveButton(android.R.string.ok, new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int which) {
              Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                  Uri.parse("package:" + getPackageName()));
              startActivityForResult(intent, KernelConstants.OVERLAY_PERMISSION_REQUEST_CODE);
            }
          })
          .setCancelable(false)
          .show();

      return;
    }

    startReactInstance();
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);

    Exponent.getInstance().onActivityResult(requestCode, resultCode, data);

    // Have permission to draw over other apps. Resume loading.
    if (requestCode == KernelConstants.OVERLAY_PERMISSION_REQUEST_CODE) {
      // startReactInstance() checks isInForeground and onActivityResult is called before onResume,
      // so manually set this here.
      mIsInForeground = true;
      startReactInstance();
    }
  }

  public RNObject startReactInstance(final Exponent.StartReactInstanceDelegate delegate, final String mIntentUri, final RNObject mLinkingPackage,
                                     final String mSDKVersion, final ExponentNotification mNotification, final boolean mIsShellApp,
                                     final List<? extends Object> extraNativeModules, final List<Package> extraExpoPackages, DevBundleDownloadProgressListener progressListener) {

    if (mIsCrashed || !delegate.isInForeground()) {
      // Can sometimes get here after an error has occurred. Return early or else we'll hit
      // a null pointer at mReactRootView.startReactApplication
      return new RNObject("com.facebook.react.ReactInstanceManager");
    }

    String linkingUri = getLinkingUri();
    Map<String, Object> experienceProperties = MapBuilder.<String, Object>of(
        MANIFEST_URL_KEY, mManifestUrl,
        LINKING_URI_KEY, linkingUri,
        INTENT_URI_KEY, mIntentUri
    );

    Exponent.InstanceManagerBuilderProperties instanceManagerBuilderProperties = new Exponent.InstanceManagerBuilderProperties();
    instanceManagerBuilderProperties.application = getApplication();
    instanceManagerBuilderProperties.jsBundlePath = mJSBundlePath;
    instanceManagerBuilderProperties.linkingPackage = mLinkingPackage;
    instanceManagerBuilderProperties.experienceProperties = experienceProperties;
    instanceManagerBuilderProperties.expoPackages = extraExpoPackages;
    instanceManagerBuilderProperties.exponentPackageDelegate = delegate.getExponentPackageDelegate();
    instanceManagerBuilderProperties.manifest = mManifest;

    RNObject versionedUtils = new RNObject("host.exp.exponent.VersionedUtils").loadVersion(mSDKVersion);
    RNObject builder = versionedUtils.callRecursive("getReactInstanceManagerBuilder", instanceManagerBuilderProperties);

    if (extraNativeModules != null) {
      for (Object nativeModule : extraNativeModules) {
        builder.call("addPackage", nativeModule);
      }
    }

    if (delegate.isDebugModeEnabled()) {
      String debuggerHost = mManifest.optString(ExponentManifest.MANIFEST_DEBUGGER_HOST_KEY);
      String mainModuleName = mManifest.optString(ExponentManifest.MANIFEST_MAIN_MODULE_NAME_KEY);
      Exponent.enableDeveloperSupport(mSDKVersion, debuggerHost, mainModuleName, builder);

      if (ABIVersion.toNumber(mSDKVersion) >= ABIVersion.toNumber("20.0.0")) {
        RNObject devLoadingView = new RNObject("com.facebook.react.devsupport.DevLoadingViewController").loadVersion(mSDKVersion);
        devLoadingView.callRecursive("setDevLoadingEnabled", false);

        RNObject devBundleDownloadListener = new RNObject("host.exp.exponent.ExponentDevBundleDownloadListener")
            .loadVersion(mSDKVersion)
            .construct(progressListener);
        builder.callRecursive("setDevBundleDownloadListener", devBundleDownloadListener.get());
      }

      // checkForReactViews() is normally called in dev mode by devBundleDownloadListener.onSuccess()
      // so that AppLoading will continue to show the splash screen correctly. However, the
      // onSuccess() method is not called by RN for SDK 25 and below, so we need to check for react views here
      // TODO: remove once SDK 25 is phased out
      if (ABIVersion.toNumber(mSDKVersion) < ABIVersion.toNumber("26.0.0")) {
        checkForReactViews();
      }
    } else {
      checkForReactViews();
    }

    Bundle bundle = new Bundle();
    JSONObject exponentProps = new JSONObject();
    if (mNotification != null) {
      bundle.putString("notification", mNotification.body); // Deprecated
      try {
        if (ABIVersion.toNumber(mSDKVersion) < ABIVersion.toNumber("10.0.0")) {
          exponentProps.put("notification", mNotification.body);
        } else {
          exponentProps.put("notification", mNotification.toJSONObject("selected"));
        }
      } catch (JSONException e) {
        e.printStackTrace();
      }
    }

    try {
      exponentProps.put("manifest", mManifest);
      exponentProps.put("shell", mIsShellApp);
      exponentProps.put("initialUri", mIntentUri == null ? null : mIntentUri.toString());
      exponentProps.put("errorRecovery", ErrorRecoveryManager.getInstance(mExperienceId).popRecoveryProps());
    } catch (JSONException e) {
      EXL.e(TAG, e);
    }

    JSONObject metadata = mExponentSharedPreferences.getExperienceMetadata(mExperienceIdString);
    if (metadata != null) {
      if (metadata.has(ExponentSharedPreferences.EXPERIENCE_METADATA_LAST_ERRORS)) {
        try {
          exponentProps.put(ExponentSharedPreferences.EXPERIENCE_METADATA_LAST_ERRORS,
              metadata.getJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_LAST_ERRORS));
        } catch (JSONException e) {
          e.printStackTrace();
        }

        metadata.remove(ExponentSharedPreferences.EXPERIENCE_METADATA_LAST_ERRORS);
      }

      // TODO: fix this. this is the only place that EXPERIENCE_METADATA_UNREAD_REMOTE_NOTIFICATIONS is sent to the experience,
      // we need to sent them with the standard notification events so that you can get all the unread notification through an event
      // Copy unreadNotifications into exponentProps
      if (metadata.has(ExponentSharedPreferences.EXPERIENCE_METADATA_UNREAD_REMOTE_NOTIFICATIONS)) {
        try {
          JSONArray unreadNotifications = metadata.getJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_UNREAD_REMOTE_NOTIFICATIONS);
          exponentProps.put(ExponentSharedPreferences.EXPERIENCE_METADATA_UNREAD_REMOTE_NOTIFICATIONS, unreadNotifications);

          delegate.handleUnreadNotifications(unreadNotifications);
        } catch (JSONException e) {
          e.printStackTrace();
        }

        metadata.remove(ExponentSharedPreferences.EXPERIENCE_METADATA_UNREAD_REMOTE_NOTIFICATIONS);
      }

      mExponentSharedPreferences.updateExperienceMetadata(mExperienceIdString, metadata);
    }

    bundle.putBundle("exp", JSONBundleConverter.JSONToBundle(exponentProps));

    if (!delegate.isInForeground()) {
      return new RNObject("com.facebook.react.ReactInstanceManager");
    }

    Analytics.markEvent(Analytics.TimedEvent.STARTED_LOADING_REACT_NATIVE);
    RNObject mReactInstanceManager = builder.callRecursive("build");
    RNObject devSettings = mReactInstanceManager.callRecursive("getDevSupportManager").callRecursive("getDevSettings");
    if (devSettings != null) {
      devSettings.setField("exponentActivityId", mActivityId);
      if ((boolean) devSettings.call("isRemoteJSDebugEnabled")) {
        checkForReactViews();
      }
    }

    mReactInstanceManager.onHostResume(this, this);
    mReactRootView.call("startReactApplication",
        mReactInstanceManager.get(),
        mManifest.optString(ExponentManifest.MANIFEST_APP_KEY_KEY, KernelConstants.DEFAULT_APPLICATION_KEY),
        initialProps(bundle));

    return mReactInstanceManager;
  }

  protected boolean shouldShowErrorScreen(ExponentErrorMessage errorMessage) {
    if (mIsLoading) {
      // Don't hit ErrorRecoveryManager until bridge is initialized.
      // This is the same on iOS.
      return true;
    }

    ErrorRecoveryManager errorRecoveryManager = ErrorRecoveryManager.getInstance(mExperienceId);

    errorRecoveryManager.markErrored();

    if (errorRecoveryManager.shouldReloadOnError()) {
      if (!KernelProvider.getInstance().reloadVisibleExperience(mManifestUrl)) {
        // Kernel couldn't reload, show error screen
        return true;
      }
      sErrorQueue.clear();

      try {
        JSONObject eventProperties = new JSONObject();
        eventProperties.put(Analytics.USER_ERROR_MESSAGE, errorMessage.userErrorMessage());
        eventProperties.put(Analytics.DEVELOPER_ERROR_MESSAGE, errorMessage.developerErrorMessage());
        eventProperties.put(Analytics.MANIFEST_URL, mManifestUrl);
        Analytics.logEvent(Analytics.ERROR_RELOADED, eventProperties);
      } catch (Exception e) {
        EXL.e(TAG, e.getMessage());
      }

      return false;
    } else {
      return true;
    }
  }

  public void onEventMainThread(KernelConstants.AddedExperienceEventEvent event) {
    if (mManifestUrl != null && mManifestUrl.equals(event.manifestUrl)) {
      pollForEventsToSendToRN();
    }
  }

  public void onEvent(BaseExperienceActivity.ExperienceContentLoaded event) {
    fadeLoadingScreen();
  }

  private void pollForEventsToSendToRN() {
    if (mManifestUrl == null) {
      return;
    }

    try {
      RNObject rctDeviceEventEmitter = new RNObject("com.facebook.react.modules.core.DeviceEventManagerModule$RCTDeviceEventEmitter");
      rctDeviceEventEmitter.loadVersion(mDetachSdkVersion);
      RNObject existingEmitter = mReactInstanceManager.callRecursive("getCurrentReactContext")
          .callRecursive("getJSModule", rctDeviceEventEmitter.rnClass());

      if (existingEmitter != null) {
        Set<KernelConstants.ExperienceEvent> events = KernelProvider.getInstance().consumeExperienceEvents(mManifestUrl);

        for (KernelConstants.ExperienceEvent event : events) {
          existingEmitter.call("emit", event.eventName, event.eventPayload);
        }
      }
    } catch (Throwable e) {
      EXL.e(TAG, e);
    }
  }

  // deprecated in favor of Expo.Linking.makeUrl
  // TODO: remove this
  private String getLinkingUri() {
    if (Constants.SHELL_APP_SCHEME != null) {
      return Constants.SHELL_APP_SCHEME + "://";
    } else {
      if (ABIVersion.toNumber(mSDKVersion) < ABIVersion.toNumber("27.0.0")) {
        // keep old behavior on old projects to not introduce breaking changes
        return mManifestUrl + "/+";
      }
      Uri uri = Uri.parse(mManifestUrl);
      String host = uri.getHost();
      if (host != null && (host.equals("exp.host") || host.equals("expo.io") || host.equals("exp.direct") || host.equals("expo.test") ||
          host.endsWith(".exp.host") || host.endsWith(".expo.io") || host.endsWith(".exp.direct") || host.endsWith(".expo.test"))) {
        List<String> pathSegments = uri.getPathSegments();
        Uri.Builder builder = uri.buildUpon();
        builder.path(null);

        for (String segment : pathSegments) {
          if (ExponentManifest.DEEP_LINK_SEPARATOR.equals(segment)) {
            break;
          }
          builder.appendEncodedPath(segment);
        }

        return builder.appendEncodedPath(ExponentManifest.DEEP_LINK_SEPARATOR_WITH_SLASH).build().toString();
      } else {
        return mManifestUrl;
      }
    }
  }
}
