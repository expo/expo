// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.support.v4.app.NotificationCompat;
import android.support.v4.content.ContextCompat;
import android.text.TextUtils;
import android.view.View;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.widget.RemoteViews;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.soloader.SoLoader;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.lang.ref.WeakReference;
import java.util.Collections;
import java.util.List;

import javax.annotation.Nullable;
import javax.inject.Inject;

import de.greenrobot.event.EventBus;
import expo.core.interfaces.Package;
import host.exp.exponent.ABIVersion;
import host.exp.exponent.AppLoader;
import host.exp.exponent.Constants;
import host.exp.exponent.ExponentIntentService;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.LauncherActivity;
import host.exp.exponent.RNObject;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.branch.BranchManager;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.ExponentError;
import host.exp.exponent.kernel.ExponentUrls;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.kernel.KernelProvider;
import host.exp.exponent.notifications.ExponentNotification;
import host.exp.exponent.notifications.ExponentNotificationManager;
import host.exp.exponent.notifications.NotificationConstants;
import host.exp.exponent.notifications.PushNotificationHelper;
import host.exp.exponent.notifications.ReceivedNotificationEvent;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.utils.AsyncCondition;
import host.exp.exponent.utils.ExperienceActivityUtils;
import host.exp.expoview.Exponent;
import host.exp.expoview.R;
import versioned.host.exp.exponent.ExponentPackageDelegate;
import versioned.host.exp.exponent.ReactUnthemedRootView;

import static host.exp.exponent.kernel.KernelConstants.IS_OPTIMISTIC_KEY;
import static host.exp.exponent.kernel.KernelConstants.MANIFEST_URL_KEY;

public class ExperienceActivity extends BaseExperienceActivity implements Exponent.StartReactInstanceDelegate {

  // Override
  public List<ReactPackage> reactPackages() {
    return null;
  }
  public List<Package> expoPackages() {
    return Collections.emptyList();
  }

  @Override
  public ExponentPackageDelegate getExponentPackageDelegate() {
    return null;
  }

  public boolean forceUnversioned() {
    return false;
  }

  private static final String TAG = ExperienceActivity.class.getSimpleName();

  private static final String KERNEL_STARTED_RUNNING_KEY = "experienceActivityKernelDidLoad";
  private static final String NUX_REACT_MODULE_NAME = "ExperienceNuxApp";
  private static final int NOTIFICATION_ID = 10101;
  private static String READY_FOR_BUNDLE = "readyForBundle";

  private RNObject mLinkingPackage = null;
  private ReactUnthemedRootView mNuxOverlayView;
  private ExponentNotification mNotification;
  private ExponentNotification mTempNotification;
  private boolean mIsShellApp;
  private String mIntentUri;
  private boolean mIsReadyForBundle;

  private RemoteViews mNotificationRemoteViews;
  private Handler mNotificationAnimationHandler;
  private Runnable mNotificationAnimator;
  private int mNotificationAnimationFrame;
  private NotificationCompat.Builder mNotificationBuilder;
  private boolean mIsLoadExperienceAllowedToRun = false;
  private boolean mShouldShowLoadingScreenWithOptimisticManifest = false;

  @Inject
  ExponentManifest mExponentManifest;

  private DevBundleDownloadProgressListener mDevBundleDownloadProgressListener = new DevBundleDownloadProgressListener() {
    @Override
    public void onProgress(final @Nullable String status, final @Nullable Integer done, final @Nullable Integer total) {
      UiThreadUtil.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          updateLoadingProgress(status, done, total);
        }
      });
    }

    @Override
    public void onSuccess() {
      UiThreadUtil.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          checkForReactViews();
        }
      });
    }

    @Override
    public void onFailure(Exception error) {
      UiThreadUtil.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          stopLoading();
        }
      });
    }
  };

  /*
   *
   * Lifecycle
   *
   */

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    mIsLoadExperienceAllowedToRun = true;
    mShouldShowLoadingScreenWithOptimisticManifest = true;

    NativeModuleDepsProvider.getInstance().inject(ExperienceActivity.class, this);
    EventBus.getDefault().registerSticky(this);

    mActivityId = Exponent.getActivityId();

    // TODO: audit this now that kernel logic is in Java
    boolean shouldOpenImmediately = true;

    // If our activity was killed for memory reasons or because of "Don't keep activities",
    // try to reload manifest using the savedInstanceState
    if (savedInstanceState != null) {
      String manifestUrl = savedInstanceState.getString(MANIFEST_URL_KEY);
      if (manifestUrl != null) {
        mManifestUrl = manifestUrl;
      }
    }

    // On cold boot to experience, we're given this information from the Java kernel, instead of
    // the JS kernel.
    Bundle bundle = getIntent().getExtras();
    if (bundle != null && mManifestUrl == null) {
      String manifestUrl = bundle.getString(MANIFEST_URL_KEY);
      if (manifestUrl != null) {
        mManifestUrl = manifestUrl;
      }

      // Don't want to get here if savedInstanceState has manifestUrl. Only care about
      // IS_OPTIMISTIC_KEY the first time onCreate is called.
      boolean isOptimistic = bundle.getBoolean(IS_OPTIMISTIC_KEY);
      if (isOptimistic) {
        shouldOpenImmediately = false;
      }
    }

    if (mManifestUrl != null && shouldOpenImmediately) {
      new AppLoader(mManifestUrl) {
        @Override
        public void onOptimisticManifest(final JSONObject optimisticManifest) {
          Exponent.getInstance().runOnUiThread(new Runnable() {
            @Override
            public void run() {
              setLoadingScreenManifest(optimisticManifest);
            }
          });
        }

        @Override
        public void onManifestCompleted(final JSONObject manifest) {
          Exponent.getInstance().runOnUiThread(new Runnable() {
            @Override
            public void run() {
              try {
                String bundleUrl = ExponentUrls.toHttp(manifest.getString("bundleUrl"));

                setManifest(mManifestUrl, manifest, bundleUrl, null);
              } catch (JSONException e) {
                mKernel.handleError(e);
              }
            }
          });
        }

        @Override
        public void onBundleCompleted(String localBundlePath) {
          setBundle(localBundlePath);
        }

        @Override
        public void emitEvent(JSONObject params) {
          emitUpdatesEvent(params);
        }

        @Override
        public void onError(Exception e) {
          mKernel.handleError(e);
        }

        @Override
        public void onError(String e) {
          mKernel.handleError(e);
        }
      }.start();
    }

    mKernel.setOptimisticActivity(this, getTaskId());
  }

  @Override
  protected void onResume() {
    super.onResume();

    soloaderInit();

    addNotification(null);
    Analytics.logEventWithManifestUrl(Analytics.EXPERIENCE_APPEARED, mManifestUrl);

    registerForNotifications();
  }

  public void soloaderInit() {
    if (mDetachSdkVersion != null) {
      try {
        new RNObject("com.facebook.soloader.SoLoader")
            .loadVersion(mDetachSdkVersion)
            .callStatic("init", this, false);
      } catch (Throwable e) {
        // Starting with SDK 8, SoLoader moved out into a library, so it isn't versioned anymore
        SoLoader.init(this, false);
      }
    }
  }

  public void shouldCheckOptions() {
    if (mManifestUrl != null && mKernel.hasOptionsForManifestUrl(mManifestUrl)) {
      handleOptions(mKernel.popOptionsForManifestUrl(mManifestUrl));
    }

    // this is old code from before `Expo.Notifications.dismissAllNotificationsAsync` existed
    // since removing it is a breaking change (people have to call ^^^ explicitly if they want
    // this behavior) we only do it starting in SDK 28
    // TODO: eric: remove this once SDK 27 is phased out
    if (mSDKVersion != null && ABIVersion.toNumber(mSDKVersion) < ABIVersion.toNumber("28.0.0")) {
      clearNotifications();
    }
  }

  // TODO: eric: remove this once SDK 27 is phased out
  protected void clearNotifications() {
    String experienceId = mManifest.optString(ExponentManifest.MANIFEST_ID_KEY);
    if (experienceId != null) {
      ExponentNotificationManager manager = new ExponentNotificationManager(this);
      manager.cancelAll(experienceId);
    }
  }

  @Override
  protected void onPause() {
    super.onPause();

    removeNotification();
    Analytics.clearTimedEvents();
  }

  @Override
  public void onSaveInstanceState(Bundle savedInstanceState) {
    savedInstanceState.putString(MANIFEST_URL_KEY, mManifestUrl);

    super.onSaveInstanceState(savedInstanceState);
  }

  @Override
  public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      Uri uri = intent.getData();
      if (uri != null) {
        handleUri(uri.toString());
      }
    } else {
      // Always just restart this activity. Don't call Activity.recreate() because that uses
      // the old savedInstanceState.
      finish();
      startActivity(intent);
    }
  }

  public void onEventMainThread(Kernel.KernelStartedRunningEvent event) {
    AsyncCondition.notify(KERNEL_STARTED_RUNNING_KEY);
  }

  @Override
  protected void onDoneLoading() {
    Analytics.markEvent(Analytics.TimedEvent.FINISHED_LOADING_REACT_NATIVE);
    Analytics.sendTimedEvents(mManifestUrl);
  }

  /*
   *
   * Experience Loading
   *
   */

  public void setLoadingScreenManifest(final JSONObject manifest) {
    runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if (!isInForeground()) {
          return;
        }

        if (!mShouldShowLoadingScreenWithOptimisticManifest) {
          return;
        }

        // grab SDK version from optimisticManifest -- in this context we just need to know ensure it's above 5.0.0 (which it should always be)
        String optimisticSdkVersion = manifest.optString(ExponentManifest.MANIFEST_SDK_VERSION_KEY);
        ExperienceActivityUtils.setWindowTransparency(optimisticSdkVersion, manifest, ExperienceActivity.this);

        showLoadingScreen(manifest);

        ExperienceActivityUtils.setTaskDescription(mExponentManifest, manifest, ExperienceActivity.this);
      }
    });
  }

  public void setManifest(String manifestUrl, final JSONObject manifest, final String bundleUrl, final JSONObject kernelOptions) {
    if (!isInForeground()) {
      return;
    }

    if (!mIsLoadExperienceAllowedToRun) {
      return;
    }
    // Only want to run once per onCreate. There are some instances with ShellAppActivity where this would be called
    // twice otherwise. Turn on "Don't keep activites", trigger a notification, background the app, and then
    // press on the notification in a shell app to see this happen.
    mIsLoadExperienceAllowedToRun = false;

    mIsReadyForBundle = false;

    mManifestUrl = manifestUrl;
    mManifest = manifest;

    new ExponentNotificationManager(this).maybeCreateNotificationChannelGroup(mManifest);

    Kernel.ExperienceActivityTask task = mKernel.getExperienceActivityTask(mManifestUrl);
    task.taskId = getTaskId();
    task.experienceActivity = new WeakReference<>(this);
    task.activityId = mActivityId;
    task.bundleUrl = bundleUrl;

    mSDKVersion = manifest.optString(ExponentManifest.MANIFEST_SDK_VERSION_KEY);
    mIsShellApp = manifestUrl.equals(Constants.INITIAL_URL);

    // Sometime we want to release a new version without adding a new .aar. Use TEMPORARY_ABI_VERSION
    // to point to the unversioned code in ReactAndroid.
    if (Constants.TEMPORARY_ABI_VERSION != null && Constants.TEMPORARY_ABI_VERSION.equals(mSDKVersion)) {
      mSDKVersion = RNObject.UNVERSIONED;
    }
    mDetachSdkVersion = forceUnversioned() ? RNObject.UNVERSIONED : mSDKVersion;

    if (!RNObject.UNVERSIONED.equals(mSDKVersion)) {
      boolean isValidVersion = false;
      for (final String version : Constants.SDK_VERSIONS_LIST) {
        if (version.equals(mSDKVersion)) {
          isValidVersion = true;
          break;
        }
      }

      if (!isValidVersion) {
        KernelProvider.getInstance().handleError(mSDKVersion + " is not a valid SDK version. Options are " +
            TextUtils.join(", ", Constants.SDK_VERSIONS_LIST) + ", " + RNObject.UNVERSIONED + ".");
        return;
      }
    }

    soloaderInit();

    try {
      mExperienceIdString = manifest.getString(ExponentManifest.MANIFEST_ID_KEY);
      mExperienceId = ExperienceId.create(mExperienceIdString);
      AsyncCondition.notify(KernelConstants.EXPERIENCE_ID_SET_FOR_ACTIVITY_KEY);
    } catch (JSONException e) {
      KernelProvider.getInstance().handleError("No ID found in manifest.");
      return;
    }
    mIsCrashed = false;

    Analytics.logEventWithManifestUrlSdkVersion(Analytics.LOAD_EXPERIENCE, mManifestUrl, mSDKVersion);

    ExperienceActivityUtils.updateOrientation(mManifest, this);
    addNotification(kernelOptions);

    ExponentNotification notificationObject = null;
    if (mKernel.hasOptionsForManifestUrl(manifestUrl)) {
      KernelConstants.ExperienceOptions options = mKernel.popOptionsForManifestUrl(manifestUrl);

      // if the kernel has an intent for our manifest url, that's the intent that triggered
      // the loading of this experience.
      if (options.uri != null) {
        mIntentUri = options.uri;
      }

      notificationObject = options.notificationObject;
    }

    // if we have an embedded initial url, we never need any part of this in the initial url
    // passed to the JS, so we check for that and filter it out here.
    // this can happen in dev mode on a detached app, for example, because the intent will have
    // a url like customscheme://localhost:19000 but we don't care about the localhost:19000 part.
    if (mIntentUri == null || mIntentUri.equals(Constants.INITIAL_URL)) {
      if (Constants.SHELL_APP_SCHEME != null) {
        mIntentUri = Constants.SHELL_APP_SCHEME + "://";
      } else {
        mIntentUri = mManifestUrl;
      }
    }

    final ExponentNotification finalNotificationObject = notificationObject;

    // TODO: deprecated
    // LinkingPackage was removed after ABI 5.0.0
    if (ABIVersion.toNumber(mDetachSdkVersion) <= ABIVersion.toNumber("5.0.0")) {
      mLinkingPackage = new RNObject("host.exp.exponent.modules.external.linking.LinkingPackage");
      mLinkingPackage.loadVersion(mDetachSdkVersion).construct(this, mIntentUri);
    }

    BranchManager.handleLink(this, mIntentUri, mDetachSdkVersion);

    runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if (!isInForeground()) {
          return;
        }

        if (mReactInstanceManager.isNotNull()) {
          mReactInstanceManager.onHostDestroy();
          mReactInstanceManager.assign(null);
        }

        // ReactUnthemedRootView was moved after ABI 5.0.0 as part of a refactor
        if (ABIVersion.toNumber(mDetachSdkVersion) <= ABIVersion.toNumber("5.0.0")) {
          mReactRootView = new RNObject("host.exp.exponent.views.ReactUnthemedRootView");
        } else {
          mReactRootView = new RNObject("host.exp.exponent.ReactUnthemedRootView");
        }
        mReactRootView.loadVersion(mDetachSdkVersion).construct(ExperienceActivity.this);
        setView((View) mReactRootView.get());

        String id;
        try {
          id = Exponent.getInstance().encodeExperienceId(mExperienceIdString);
        } catch (UnsupportedEncodingException e) {
          KernelProvider.getInstance().handleError("Can't URL encode manifest ID");
          return;
        }

        boolean hasCachedBundle;
        if (isDebugModeEnabled()) {
          hasCachedBundle = false;
          mNotification = finalNotificationObject;
          waitForDrawOverOtherAppPermission("");
        } else {
          mTempNotification = finalNotificationObject;
          mIsReadyForBundle = true;
          AsyncCondition.notify(READY_FOR_BUNDLE);
        }

        ExperienceActivityUtils.setWindowTransparency(mDetachSdkVersion, manifest, ExperienceActivity.this);

        showLoadingScreen(manifest);

        ExperienceActivityUtils.setTaskDescription(mExponentManifest, manifest, ExperienceActivity.this);
        handleExperienceOptions(kernelOptions);
      }
    });
  }

  public void setBundle(final String localBundlePath) {
    // by this point, setManifest should have also been called, so prevent
    // setLoadingScreenManifest from showing a rogue loading screen
    mShouldShowLoadingScreenWithOptimisticManifest = false;
    if (!isDebugModeEnabled()) {
      final boolean finalIsReadyForBundle = mIsReadyForBundle;
      AsyncCondition.wait(READY_FOR_BUNDLE, new AsyncCondition.AsyncConditionListener() {
        @Override
        public boolean isReady() {
          return finalIsReadyForBundle;
        }

        @Override
        public void execute() {
          mNotification = mTempNotification;
          mTempNotification = null;
          waitForDrawOverOtherAppPermission(localBundlePath);
          AsyncCondition.remove(READY_FOR_BUNDLE);
        }
      });
    }
  }

  public void onEventMainThread(ReceivedNotificationEvent event) {
    if (ABIVersion.toNumber(mDetachSdkVersion) < ABIVersion.toNumber("8.0.0")) {
      return;
    }

    if (event.experienceId.equals(mExperienceIdString)) {
      try {
        RNObject rctDeviceEventEmitter = new RNObject("com.facebook.react.modules.core.DeviceEventManagerModule$RCTDeviceEventEmitter");
        rctDeviceEventEmitter.loadVersion(mDetachSdkVersion);

        mReactInstanceManager.callRecursive("getCurrentReactContext")
            .callRecursive("getJSModule", rctDeviceEventEmitter.rnClass())
            .call("emit", "Exponent.notification", event.toWriteableMap(mDetachSdkVersion, "received"));
      } catch (Throwable e) {
        EXL.e(TAG, e);
      }
    }
  }

  public void handleOptions(KernelConstants.ExperienceOptions options) {
    try {
      if (options.uri != null) {
        handleUri(options.uri);
        String uri = options.uri;

        if (uri != null) {
          RNObject rctDeviceEventEmitter = new RNObject("com.facebook.react.modules.core.DeviceEventManagerModule$RCTDeviceEventEmitter");
          rctDeviceEventEmitter.loadVersion(mDetachSdkVersion);

          mReactInstanceManager.callRecursive("getCurrentReactContext")
              .callRecursive("getJSModule", rctDeviceEventEmitter.rnClass())
              .call("emit", "Exponent.openUri", uri);
        }

        BranchManager.handleLink(this, options.uri, mDetachSdkVersion);
      }

      if ((options.notification != null || options.notificationObject != null) && mDetachSdkVersion != null) {
        if (ABIVersion.toNumber(mDetachSdkVersion) < ABIVersion.toNumber("8.0.0")) {
          // TODO: kill
          RNObject rctDeviceEventEmitter = new RNObject("com.facebook.react.modules.core.DeviceEventManagerModule$RCTDeviceEventEmitter");
          rctDeviceEventEmitter.loadVersion(mDetachSdkVersion);

          mReactInstanceManager.callRecursive("getCurrentReactContext")
              .callRecursive("getJSModule", rctDeviceEventEmitter.rnClass())
              .call("emit", "Exponent.notification", options.notification);
        } else {
          RNObject rctDeviceEventEmitter = new RNObject("com.facebook.react.modules.core.DeviceEventManagerModule$RCTDeviceEventEmitter");
          rctDeviceEventEmitter.loadVersion(mDetachSdkVersion);

          mReactInstanceManager.callRecursive("getCurrentReactContext")
              .callRecursive("getJSModule", rctDeviceEventEmitter.rnClass())
              .call("emit", "Exponent.notification", options.notificationObject.toWriteableMap(mDetachSdkVersion, "selected"));
        }
      }
    } catch (Throwable e) {
      EXL.e(TAG, e);
    }
  }

  private void handleUri(String uri) {
    if (mLinkingPackage != null && mLinkingPackage.isNotNull()) {
      mLinkingPackage.call("onNewUri", uri);
    }

    // Emits a "url" event to the Linking event emitter
    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(uri));
    super.onNewIntent(intent);
  }

  public void emitUpdatesEvent(JSONObject params) {
    KernelProvider.getInstance().addEventForExperience(mManifestUrl, new KernelConstants.ExperienceEvent(AppLoader.UPDATES_EVENT_NAME, params.toString()));
  }

  @Override
  public boolean isDebugModeEnabled() {
    return ExponentManifest.isDebugModeEnabled(mManifest);
  }

  @Override
  protected void startReactInstance() {
    Exponent.getInstance().testPackagerStatus(isDebugModeEnabled(), mManifest, new Exponent.PackagerStatusCallback() {
      @Override
      public void onSuccess() {
        mReactInstanceManager = startReactInstance(ExperienceActivity.this, mIntentUri, mLinkingPackage, mDetachSdkVersion, mNotification, mIsShellApp, reactPackages(), expoPackages(), mDevBundleDownloadProgressListener);
      }

      @Override
      public void onFailure(final String errorMessage) {
        KernelProvider.getInstance().handleError(errorMessage);
      }
    });
  }

  @Override
  public void handleUnreadNotifications(JSONArray unreadNotifications) {
    PushNotificationHelper pushNotificationHelper = PushNotificationHelper.getInstance();
    if (pushNotificationHelper != null) {
      pushNotificationHelper.removeNotifications(this, unreadNotifications);
    }
  }

  public void onEvent(BaseExperienceActivity.ExperienceDoneLoadingEvent event) {
    // On cold boot to this experience, wait until we're done loading to load the kernel.
    mKernel.startJSKernel();
  }

  /*
   *
   * Notification
   *
   */

  private void addNotification(final JSONObject options) {
    if (mManifestUrl == null || mManifest == null) {
      return;
    }

    String name = mManifest.optString(ExponentManifest.MANIFEST_NAME_KEY, null);
    if (name == null) {
      return;
    }

    if (!mManifest.optBoolean(ExponentManifest.MANIFEST_SHOW_EXPONENT_NOTIFICATION_KEY) && mIsShellApp) {
      return;
    }

    RemoteViews remoteViews = new RemoteViews(getPackageName(), mIsShellApp ? R.layout.notification_shell_app : R.layout.notification);
    remoteViews.setCharSequence(R.id.home_text_button, "setText", name);

    // Home
    Intent homeIntent = new Intent(this, LauncherActivity.class);
    remoteViews.setOnClickPendingIntent(R.id.home_image_button, PendingIntent.getActivity(this, 0,
        homeIntent, 0));

    // Info
    // Doing PendingIntent.getActivity doesn't work here - it opens the activity in the main
    // stack and not in the experience's stack
    remoteViews.setOnClickPendingIntent(R.id.home_text_button, PendingIntent.getService(this, 0,
        ExponentIntentService.getActionInfoScreen(this, mManifestUrl), PendingIntent.FLAG_UPDATE_CURRENT));

    if (!mIsShellApp) {
      // Share
      // TODO: add analytics
      Intent shareIntent = new Intent(Intent.ACTION_SEND);
      shareIntent.setType("text/plain");
      shareIntent.putExtra(Intent.EXTRA_SUBJECT, name + " on Exponent");
      shareIntent.putExtra(Intent.EXTRA_TEXT, mManifestUrl);
      remoteViews.setOnClickPendingIntent(R.id.share_button, PendingIntent.getActivity(this, 0,
          Intent.createChooser(shareIntent, "Share a link to " + name), PendingIntent.FLAG_UPDATE_CURRENT));

      // Save
      remoteViews.setOnClickPendingIntent(R.id.save_button, PendingIntent.getService(this, 0,
          ExponentIntentService.getActionSaveExperience(this, mManifestUrl),
          PendingIntent.FLAG_UPDATE_CURRENT));
    }

    // Reload
    remoteViews.setOnClickPendingIntent(R.id.reload_button, PendingIntent.getService(this, 0,
        ExponentIntentService.getActionReloadExperience(this, mManifestUrl), PendingIntent.FLAG_UPDATE_CURRENT));

    mNotificationRemoteViews = remoteViews;

    // Build the actual notification
    final NotificationManager notificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
    notificationManager.cancel(NOTIFICATION_ID);

    new ExponentNotificationManager(this).maybeCreateExpoPersistentNotificationChannel();
    mNotificationBuilder = new NotificationCompat.Builder(this, NotificationConstants.NOTIFICATION_EXPERIENCE_CHANNEL_ID)
        .setContent(mNotificationRemoteViews)
        .setSmallIcon(R.drawable.notification_icon)
        .setShowWhen(false)
        .setOngoing(true)
        .setPriority(Notification.PRIORITY_MAX);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      mNotificationBuilder.setColor(ContextCompat.getColor(this, R.color.colorPrimary));
    }
    notificationManager.notify(NOTIFICATION_ID, mNotificationBuilder.build());
  }

  private void removeNotification() {
    mNotificationRemoteViews = null;
    mNotificationBuilder = null;
    removeNotification(this);
  }

  private void handleExperienceOptions(JSONObject options) {
    if (options != null) {
      try {
        if (options.getBoolean(KernelConstants.OPTION_LOAD_NUX_KEY) && !Constants.DISABLE_NUX) {
          //addNuxView();
        }
      } catch (JSONException e) {
        EXL.e(TAG, e.getMessage());
      }
    }
  }

  private void addNuxView() {
    AsyncCondition.wait(KERNEL_STARTED_RUNNING_KEY, new AsyncCondition.AsyncConditionListener() {
      @Override
      public boolean isReady() {
        return mKernel.isRunning();
      }

      @Override
      public void execute() {
        ReactInstanceManager kernelReactInstanceManager = mKernel.getReactInstanceManager();
        mNuxOverlayView = new ReactUnthemedRootView(ExperienceActivity.this);
        mNuxOverlayView.startReactApplication(
            kernelReactInstanceManager,
            NUX_REACT_MODULE_NAME,
            null
        );
        kernelReactInstanceManager.onHostResume(ExperienceActivity.this, ExperienceActivity.this);
        addView(mNuxOverlayView);
        Analytics.logEvent("NUX_EXPERIENCE_OVERLAY_SHOWN");
      }
    });
  }

  public static void removeNotification(Context context) {
    NotificationManager notificationManager = (NotificationManager) context.getSystemService(NOTIFICATION_SERVICE);
    notificationManager.cancel(NOTIFICATION_ID);
  }

  public void onNotificationAction() {
    dismissNuxViewIfVisible(true);
  }

  /**
   * @param isFromNotification true if this is the result of the user taking an
   *                           action in the notification view.
   */
  public void dismissNuxViewIfVisible(final boolean isFromNotification) {
    if (mNuxOverlayView != null) {
      runOnUiThread(new Runnable() {
        @Override
        public void run() {
          Animation fadeOut = new AlphaAnimation(1, 0);
          fadeOut.setInterpolator(new AccelerateInterpolator());
          fadeOut.setDuration(500);

          fadeOut.setAnimationListener(new Animation.AnimationListener() {
            public void onAnimationEnd(Animation animation) {
              removeViewFromParent(mNuxOverlayView);
              mNuxOverlayView = null;

              JSONObject eventProperties = new JSONObject();
              try {
                eventProperties.put("IS_FROM_NOTIFICATION", isFromNotification);
              } catch (JSONException e) {
                EXL.e(TAG, e.getMessage());
              }
              Analytics.logEvent("NUX_EXPERIENCE_OVERLAY_DISMISSED", eventProperties);
            }

            public void onAnimationRepeat(Animation animation) {
            }

            public void onAnimationStart(Animation animation) {
            }
          });

          mNuxOverlayView.startAnimation(fadeOut);
        }
      });
    }
  }

  /*
   *
   * Errors
   *
   */

  @Override
  protected void onError(final Intent intent) {
    if (mManifestUrl != null) {
      intent.putExtra(ErrorActivity.MANIFEST_URL_KEY, mManifestUrl);
    }
  }

  @Override
  protected void onError(final ExponentError error) {
    if (mManifest == null) {
      return;
    }

    JSONObject errorJson = error.toJSONObject();
    if (errorJson == null) {
      return;
    }

    String experienceId = mManifest.optString(ExponentManifest.MANIFEST_ID_KEY);
    if (experienceId == null) {
      return;
    }

    JSONObject metadata = mExponentSharedPreferences.getExperienceMetadata(experienceId);
    if (metadata == null) {
      metadata = new JSONObject();
    }

    JSONArray errors = metadata.optJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_LAST_ERRORS);
    if (errors == null) {
      errors = new JSONArray();
    }

    errors.put(errorJson);

    try {
      metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_LAST_ERRORS, errors);
      mExponentSharedPreferences.updateExperienceMetadata(experienceId, metadata);
    } catch (JSONException e) {
      e.printStackTrace();
    }
  }
}
