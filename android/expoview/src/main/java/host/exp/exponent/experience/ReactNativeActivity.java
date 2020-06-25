// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Process;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.devsupport.DoubleTapReloadRecognizer;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.unimodules.core.interfaces.Package;

import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;

import javax.inject.Inject;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import de.greenrobot.event.EventBus;
import expo.modules.splashscreen.SplashScreen;
import host.exp.exponent.ABIVersion;
import host.exp.exponent.Constants;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.experience.splashscreen.ExperienceSplashScreenConfiguration;
import host.exp.exponent.experience.splashscreen.ExperienceSplashScreenManifestBasedResourceProvider;
import host.exp.exponent.experience.splashscreen.LoadingView;
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
import host.exp.exponent.notifications.ExponentNotification;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.utils.ExperienceActivityUtils;
import host.exp.exponent.utils.JSONBundleConverter;
import host.exp.exponent.utils.ScopedPermissionsRequester;
import host.exp.expoview.Exponent;
import host.exp.expoview.R;
import versioned.host.exp.exponent.ExponentPackage;

import static host.exp.exponent.kernel.KernelConstants.INTENT_URI_KEY;
import static host.exp.exponent.kernel.KernelConstants.IS_HEADLESS_KEY;
import static host.exp.exponent.kernel.KernelConstants.LINKING_URI_KEY;
import static host.exp.exponent.kernel.KernelConstants.MANIFEST_URL_KEY;
import static host.exp.exponent.utils.ScopedPermissionsRequester.EXPONENT_PERMISSIONS_REQUEST;

public abstract class ReactNativeActivity extends AppCompatActivity implements com.facebook.react.modules.core.DefaultHardwareBackBtnHandler, PermissionAwareActivity {

  public static class ExperienceDoneLoadingEvent {
    private Activity mActivity;

    ExperienceDoneLoadingEvent(Activity activity) {
      super();
      mActivity = activity;
    }

    public Activity getActivity() {
      return mActivity;
    }
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

  protected String mManifestUrl;
  protected String mExperienceIdString;
  protected ExperienceId mExperienceId;
  protected String mSDKVersion;
  protected int mActivityId;

  // In detach we want UNVERSIONED most places. We still need the numbered sdk version
  // when creating cache keys.
  protected String mDetachSdkVersion;

  protected RNObject mReactRootView;
  private DoubleTapReloadRecognizer mDoubleTapReloadRecognizer;
  protected boolean mIsLoading = true;
  protected String mJSBundlePath;
  protected JSONObject mManifest;
  protected boolean mIsInForeground = false;
  protected static Queue<ExponentError> sErrorQueue = new LinkedList<>();

  private ScopedPermissionsRequester mScopedPermissionsRequester;

  @Inject
  protected ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  ExpoKernelServiceRegistry mExpoKernelServiceRegistry;

  private FrameLayout mContainerView;
  /**
   * This view is optional and only present in 'managed workflow'
   */
  @Nullable private LoadingView mLoadingView;
  private FrameLayout mReactContainerView;

  private Handler mHandler = new Handler();

  protected boolean shouldCreateLadingView() {
    return true;
  }

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
    super.onCreate(null);

    mContainerView = new FrameLayout(this);
    // TODO (@bbarthec): unify color name R.color.splashBackground
    mContainerView.setBackgroundColor(ContextCompat.getColor(this, R.color.splashscreen_background));
    setContentView(mContainerView);

    mReactContainerView = new FrameLayout(this);
    mContainerView.addView(mReactContainerView);

    // TODO (@bbarthec) if (!Constants.isStandaloneApp()) {
    if (this.shouldCreateLadingView()) {
      mLoadingView = new LoadingView(this);
      mLoadingView.show();
      mContainerView.addView(mLoadingView);
    }

    mDoubleTapReloadRecognizer = new DoubleTapReloadRecognizer();
    Exponent.initialize(this, getApplication());
    NativeModuleDepsProvider.getInstance().inject(ReactNativeActivity.class, this);

    // Can't call this here because subclasses need to do other initialization
    // before their listener methods are called.
    // EventBus.getDefault().registerSticky(this);
  }

  protected void setReactRootView(final View reactRootView) {
    mReactContainerView.removeAllViews();
    addReactViewToContentContainer(reactRootView);
  }

  public void addReactViewToContentContainer(final View reactView) {
    if (reactView.getParent() != null) {
      ((ViewGroup) reactView.getParent()).removeView(reactView);
    }
    mReactContainerView.addView(reactView);
  }

  public boolean hasReactView(final View reactView) {
    return reactView.getParent() == mReactContainerView;
  }

  protected void hideLoadingView() {
    if (mLoadingView != null) {
      ((ViewGroup) mLoadingView.getParent()).removeView(mLoadingView);
      mLoadingView.hide();
      mLoadingView = null;
    }
  }

  protected void removeAllViewsFromContainer() {
    mContainerView.removeAllViews();
  }

  // region Loading

  /**
   * TODO: inspect this code path
   */
  public void startLoading() {
    mIsLoading = true;
    configureSplashScreenFromManifest(mManifest);
  }

  /**
   * Successfully finished loading
   */
  @UiThread
  protected void finishLoading() {
    waitForReactAndFinishLoading();
  }

  /**
   * There was an error during loading phase
   */
  protected void interruptLoading() {
    mHandler.removeCallbacksAndMessages(null);
  }

  // Loop until a view is added to the ReactRootView and once it happens run callback
  private void waitForReactRootViewToHaveChildrenAndRunCallback(Runnable callback) {
    if (mReactRootView.isNull()) {
      return;
    }
    if ((int) mReactRootView.call("getChildCount") > 0) {
      callback.run();
    } else {
      mHandler.postDelayed(() -> waitForReactRootViewToHaveChildrenAndRunCallback(callback), VIEW_TEST_INTERVAL_MS);
    }
  }

  /**
   * Waits for JS side of React to be launched and then performs final launching actions.
   */
  protected void waitForReactAndFinishLoading() {
    if (Constants.isStandaloneApp() && Constants.SHOW_LOADING_VIEW_IN_SHELL_APP) {
      ViewGroup.LayoutParams layoutParams = mContainerView.getLayoutParams();
      layoutParams.height = FrameLayout.LayoutParams.MATCH_PARENT;
      mContainerView.setLayoutParams(layoutParams);
    }
    try {
      ExperienceActivityUtils.setRootViewBackgroundColor(mManifest, getRootView());
    } catch (Exception e) {
      EXL.e(TAG, e);
    }
    this.waitForReactRootViewToHaveChildrenAndRunCallback(() -> {
      onDoneLoading();
      ErrorRecoveryManager.getInstance(mExperienceId).markExperienceLoaded();
      pollForEventsToSendToRN();
      EventBus.getDefault().post(new ExperienceDoneLoadingEvent(this));
      mIsLoading = false;
    });
  }

  // endregion

  // region SplashScreen

  /**
   * TODO: This is called twice, one time for optimistic manifest and second time with real? manifest - to be inspected
   */
  protected void configureSplashScreenFromManifest(final JSONObject manifest) {
    this.hideLoadingView();
    ExperienceSplashScreenConfiguration config = ExperienceSplashScreenConfiguration.parseManifest(manifest);
    ExperienceSplashScreenManifestBasedResourceProvider resourceProvider = new ExperienceSplashScreenManifestBasedResourceProvider(config);
    SplashScreen.show(this, config.getResizeMode(), getRootViewClass(), true, resourceProvider);
  }

  /**
   * Get what version (among versioned classes) of ReactRootView.class SplashScreen module should be looking for.
   * Based on mReactRootView that holds reference to versioned Class
   */
  protected Class<? extends ViewGroup> getRootViewClass() {
    return this.mReactRootView.rnClass();
  }

  // endregion

  @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    if (mReactInstanceManager != null && mReactInstanceManager.isNotNull() && !mIsCrashed) {
      RNObject devSupportManager = getDevSupportManager();
      if (devSupportManager != null && (boolean) devSupportManager.call("getDevSupportEnabled")) {
        boolean didDoubleTapR = Assertions.assertNotNull(mDoubleTapReloadRecognizer)
          .didDoubleTapR(keyCode, getCurrentFocus());

        if (didDoubleTapR) {
          devSupportManager.call("reloadExpoApp");
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

    destroyReactInstanceManager();

    mHandler.removeCallbacksAndMessages(null);
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

  protected void destroyReactInstanceManager() {
    if (mReactInstanceManager != null && mReactInstanceManager.isNotNull() && !mIsCrashed) {
      mReactInstanceManager.call("destroy");
    }
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);

    Exponent.getInstance().onActivityResult(requestCode, resultCode, data);

    if (mReactInstanceManager != null && mReactInstanceManager.isNotNull() && !mIsCrashed) {
      mReactInstanceManager.call("onActivityResult", this, requestCode, resultCode, data);
    }

    // Have permission to draw over other apps. Resume loading.
    if (requestCode == KernelConstants.OVERLAY_PERMISSION_REQUEST_CODE) {
      // startReactInstance() checks isInForeground and onActivityResult is called before onResume,
      // so manually set this here.
      mIsInForeground = true;
      startReactInstance();
    }
  }

  public RNObject startReactInstance(final Exponent.StartReactInstanceDelegate delegate, final String mIntentUri,
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
      INTENT_URI_KEY, mIntentUri,
      IS_HEADLESS_KEY, false
    );

    Exponent.InstanceManagerBuilderProperties instanceManagerBuilderProperties = new Exponent.InstanceManagerBuilderProperties();
    instanceManagerBuilderProperties.application = getApplication();
    instanceManagerBuilderProperties.jsBundlePath = mJSBundlePath;
    instanceManagerBuilderProperties.experienceProperties = experienceProperties;
    instanceManagerBuilderProperties.expoPackages = extraExpoPackages;
    instanceManagerBuilderProperties.exponentPackageDelegate = delegate.getExponentPackageDelegate();
    instanceManagerBuilderProperties.manifest = mManifest;
    instanceManagerBuilderProperties.singletonModules = ExponentPackage.getOrCreateSingletonModules(getApplicationContext(), mManifest, extraExpoPackages);

    RNObject versionedUtils = new RNObject("host.exp.exponent.VersionedUtils").loadVersion(mSDKVersion);
    RNObject builder = versionedUtils.callRecursive("getReactInstanceManagerBuilder", instanceManagerBuilderProperties);

    if (ABIVersion.toNumber(mSDKVersion) >= ABIVersion.toNumber("36.0.0")) {
      builder.call("setCurrentActivity", this);
    }

    // ReactNativeInstance is considered to be resumed when it has its activity attached, which is expected to be the case here
    builder.call("setInitialLifecycleState", RNObject.versionedEnum(mSDKVersion, "com.facebook.react.common.LifecycleState", "RESUMED"));

    if (extraNativeModules != null) {
      for (Object nativeModule : extraNativeModules) {
        builder.call("addPackage", nativeModule);
      }
    }

    if (delegate.isDebugModeEnabled()) {
      String debuggerHost = mManifest.optString(ExponentManifest.MANIFEST_DEBUGGER_HOST_KEY);
      String mainModuleName = mManifest.optString(ExponentManifest.MANIFEST_MAIN_MODULE_NAME_KEY);
      Exponent.enableDeveloperSupport(mSDKVersion, debuggerHost, mainModuleName, builder);

      RNObject devLoadingView = new RNObject("com.facebook.react.devsupport.DevLoadingViewController").loadVersion(mSDKVersion);
      devLoadingView.callRecursive("setDevLoadingEnabled", false);

      RNObject devBundleDownloadListener = new RNObject("host.exp.exponent.ExponentDevBundleDownloadListener")
        .loadVersion(mSDKVersion)
        .construct(progressListener);
      builder.callRecursive("setDevBundleDownloadListener", devBundleDownloadListener.get());
    } else {
      waitForReactAndFinishLoading();
    }

    Bundle bundle = new Bundle();
    JSONObject exponentProps = new JSONObject();
    if (mNotification != null) {
      bundle.putString("notification", mNotification.body); // Deprecated
      try {
        exponentProps.put("notification", mNotification.toJSONObject("selected"));
      } catch (JSONException e) {
        e.printStackTrace();
      }
    }

    try {
      exponentProps.put("manifest", mManifest);
      exponentProps.put("shell", mIsShellApp);
      exponentProps.put("initialUri", mIntentUri == null ? null : mIntentUri.toString());
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
        waitForReactAndFinishLoading();
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

  // for getting global permission
  @Override
  public int checkSelfPermission(String permission) {
    return super.checkPermission(permission, Process.myPid(), Process.myUid());
  }

  @Override
  public boolean shouldShowRequestPermissionRationale(@NonNull String permission) {
    // in scoped application we don't have `don't ask again` button
    if (!Constants.isStandaloneApp() && checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED) {
      return true;
    }
    return super.shouldShowRequestPermissionRationale(permission);
  }

  @Override
  public void requestPermissions(final String[] permissions, final int requestCode, final PermissionListener listener) {
    if (requestCode == EXPONENT_PERMISSIONS_REQUEST) {
      mScopedPermissionsRequester = new ScopedPermissionsRequester(mExperienceId);
      mScopedPermissionsRequester.requestPermissions(this, mManifest.optString(ExponentManifest.MANIFEST_NAME_KEY), permissions, listener);
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      super.requestPermissions(permissions, requestCode);
    }
  }


  @Override
  public void onRequestPermissionsResult(final int requestCode, final String[] permissions, @NonNull final int[] grantResults) {
    if (requestCode == EXPONENT_PERMISSIONS_REQUEST) {
      if (permissions.length > 0 && grantResults.length == permissions.length && mScopedPermissionsRequester != null) {
        mScopedPermissionsRequester.onRequestPermissionsResult(permissions, grantResults);
        mScopedPermissionsRequester = null;
      }
    } else {
      super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }
  }

  // for getting scoped permission
  @Override
  public int checkPermission(final String permission, final int pid, final int uid) {
    int globalResult = super.checkPermission(permission, pid, uid);
    return mExpoKernelServiceRegistry.getPermissionsKernelService().getPermissions(globalResult, getPackageManager(), permission, mExperienceId);
  }

  public RNObject getDevSupportManager() {
    return mReactInstanceManager.callRecursive("getDevSupportManager");
  }

  // deprecated in favor of Expo.Linking.makeUrl
  // TODO: remove this
  private String getLinkingUri() {
    if (Constants.SHELL_APP_SCHEME != null) {
      return Constants.SHELL_APP_SCHEME + "://";
    } else {
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
