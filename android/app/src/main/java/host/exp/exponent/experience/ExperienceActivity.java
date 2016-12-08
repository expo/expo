// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.provider.Settings;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AlertDialog;
import android.text.TextUtils;
import android.view.View;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.widget.RemoteViews;

import com.amplitude.api.Amplitude;
import com.facebook.react.ReactInstanceManager;
import com.facebook.soloader.SoLoader;

import host.exp.exponent.notifications.ReceivedNotificationEvent;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.lang.ref.WeakReference;

import javax.inject.Inject;

import de.greenrobot.event.EventBus;
import host.exp.exponent.ABIVersion;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.Constants;
import host.exp.exponent.ExponentIntentService;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.LauncherActivity;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.notifications.ExponentNotification;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.kernel.KernelProvider;
import host.exp.exponent.utils.ExperienceActivityUtils;
import host.exp.exponentview.Exponent;
import host.exp.exponentview.R;
import host.exp.exponent.RNObject;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.gcm.ExponentGcmListenerService;
import host.exp.exponent.kernel.ExponentError;
import host.exp.exponent.kernel.ExponentErrorMessage;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.storage.ExponentDB;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.utils.AsyncCondition;
import versioned.host.exp.exponent.ReactUnthemedRootView;

import static host.exp.exponent.kernel.KernelConstants.IS_OPTIMISTIC_KEY;
import static host.exp.exponent.kernel.KernelConstants.MANIFEST_URL_KEY;

public class ExperienceActivity extends BaseExperienceActivity implements Exponent.StartReactInstanceDelegate {

  private static final String TAG = ExperienceActivity.class.getSimpleName();

  private static final String KERNEL_STARTED_RUNNING_KEY = "experienceActivityKernelDidLoad";
  private static final String NUX_REACT_MODULE_NAME = "ExperienceNuxApp";
  private static final int NOTIFICATION_ID = 10101;
  // Shell apps only refresh on an error if it's been > 10s since the last error
  private static final int MIN_TIME_BETWEEN_ERROR_REFRESHES = 10000;

  private static Long sLastErrorRefreshTime = null;

  private String mManifestUrl;
  private JSONObject mManifest;
  private String mManifestId;
  private String mSDKVersion;
  private RNObject mLinkingPackage = null;
  private ReactUnthemedRootView mNuxOverlayView;
  private String mJSBundlePath;
  private ExponentNotification mNotification;
  private boolean mIsShellApp;
  private String mIntentUri;
  private int mActivityId;

  private RemoteViews mNotificationRemoteViews;
  private Handler mNotificationAnimationHandler;
  private Runnable mNotificationAnimator;
  private int mNotificationAnimationFrame;
  private Notification.Builder mNotificationBuilder;

  @Inject
  ExponentManifest mExponentManifest;

  /*
   *
   * Lifecycle
   *
   */

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

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
      ExponentSharedPreferences.ManifestAndBundleUrl manifestAndBundleUrl = mExponentSharedPreferences.getManifest(mManifestUrl);
      if (manifestAndBundleUrl != null) {
        Kernel.ExperienceActivityTask task = mKernel.getExperienceActivityTask(mManifestUrl);
        task.taskId = getTaskId();
        task.experienceActivity = new WeakReference<>(this);
        task.activityId = mActivityId;
        task.bundleUrl = manifestAndBundleUrl.bundleUrl;
        loadExperience(mManifestUrl, manifestAndBundleUrl.manifest, manifestAndBundleUrl.bundleUrl);
        return;
      } else {
        // Something went really wrong. Tell the kernel to load this again.
        mKernel.reloadVisibleExperience(mManifestUrl);
      }
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
    if (mSDKVersion != null) {
      try {
        new RNObject("com.facebook.soloader.SoLoader")
            .loadVersion(mSDKVersion)
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

    clearNotifications();
  }

  private void clearNotifications() {
    String experienceId = mManifest.optString(ExponentManifest.MANIFEST_ID_KEY);
    if (experienceId != null) {
      JSONObject metadata = mExponentSharedPreferences.getExperienceMetadata(experienceId);
      if (metadata != null) {
        if (metadata.has(ExponentSharedPreferences.EXPERIENCE_METADATA_UNREAD_NOTIFICATIONS)) {
          try {
            JSONArray unreadNotifications = metadata.getJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_UNREAD_NOTIFICATIONS);

            ExponentGcmListenerService gcmListenerService = ExponentGcmListenerService.getInstance();
            if (gcmListenerService != null) {
              gcmListenerService.removeNotifications(unreadNotifications);
            }
          } catch (JSONException e) {
            e.printStackTrace();
          }

          metadata.remove(ExponentSharedPreferences.EXPERIENCE_METADATA_UNREAD_NOTIFICATIONS);
        }

        mExponentSharedPreferences.updateExperienceMetadata(experienceId, metadata);
      }
    }
  }

  @Override
  protected void onPause() {
    super.onPause();

    removeNotification();
    Analytics.clearTimedEvents();
  }

  @Override
  public void onDestroy() {
    super.onDestroy();

    EventBus.getDefault().unregister(this);
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
      // TODO (ben): Not sure this ever actually gets called.
      handleUri(intent.getData().toString());
    } else {
      // Always just restart this activity. Don't call Activity.recreate() because that uses
      // the old savedInstanceState.
      finish();
      startActivity(intent);
    }
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);

    // Have permission to draw over other apps. Resume loading.
    if (requestCode == KernelConstants.OVERLAY_PERMISSION_REQUEST_CODE) {
      // startReactInstance() checks isInForeground and onActivityResult is called before onResume,
      // so manually set this here.
      setIsInForeground(true);
      startReactInstance();
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

  public void loadExperience(final String manifestUrl, final JSONObject manifest, final String bundleUrl) {
    loadExperience(manifestUrl, manifest, bundleUrl, null);
  }

  public void loadExperience(final String manifestUrl, final JSONObject manifest, final String bundleUrl, final JSONObject kernelOptions) {
    if (!isInForeground()) {
      return;
    }

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

    mManifestUrl = manifestUrl;
    mManifest = manifest;
    try {
      mManifestId = manifest.getString(ExponentManifest.MANIFEST_ID_KEY);
    } catch (JSONException e) {
      KernelProvider.getInstance().handleError("No ID found in manifest.");
      return;
    }
    mIsCrashed = false;

    // Update manifest on disk
    mExponentSharedPreferences.updateManifest(manifestUrl, manifest, bundleUrl);
    ExponentDB.saveExperience(manifestUrl, manifest, bundleUrl);

    Analytics.logEventWithManifestUrl(Analytics.LOAD_EXPERIENCE, mManifestUrl);

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

    final ExponentNotification finalNotificationObject = notificationObject;

    // TODO: deprecated
    // LinkingPackage was removed after ABI 5.0.0
    if (ABIVersion.toNumber(mSDKVersion) <= ABIVersion.toNumber("5.0.0")) {
      mLinkingPackage = new RNObject("host.exp.exponent.modules.external.linking.LinkingPackage");
      mLinkingPackage.loadVersion(mSDKVersion).construct(this, mIntentUri);
    }

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
        if (ABIVersion.toNumber(mSDKVersion) <= ABIVersion.toNumber("5.0.0")) {
          mReactRootView = new RNObject("host.exp.exponent.views.ReactUnthemedRootView");
        } else {
          mReactRootView = new RNObject("host.exp.exponent.ReactUnthemedRootView");
        }
        mReactRootView.loadVersion(mSDKVersion).construct(ExperienceActivity.this);
        setView((View) mReactRootView.get());

        String id;
        try {
          id = Exponent.getInstance().encodeExperienceId(mManifestId);
        } catch (UnsupportedEncodingException e) {
          KernelProvider.getInstance().handleError("Can't URL encode manifest ID");
          return;
        }

        boolean hasCachedBundle;
        if (isDebugModeEnabled()) {
          hasCachedBundle = false;
          waitForDrawOverOtherAppPermission("", finalNotificationObject);
        } else {
          hasCachedBundle = Exponent.getInstance().loadJSBundle(bundleUrl, id, mSDKVersion,
              new Exponent.BundleListener() {
                @Override
                public void onBundleLoaded(String localBundlePath) {
                  waitForDrawOverOtherAppPermission(localBundlePath, finalNotificationObject);
                }

                @Override
                public void onError(Exception e) {
                  KernelProvider.getInstance().handleError(e);
                }
              });
        }

        ExperienceActivityUtils.setWindowTransparency(mSDKVersion, manifest, ExperienceActivity.this);

        if (hasCachedBundle) {
          showLoadingScreen(manifest);
        } else {
          showLongLoadingScreen(manifest);
        }

        ExperienceActivityUtils.setTaskDescription(mExponentManifest, manifest, ExperienceActivity.this);
        handleExperienceOptions(kernelOptions);
      }
    });
  }

  public void onEventMainThread(ReceivedNotificationEvent event) {
    if (ABIVersion.toNumber(mSDKVersion) < ABIVersion.toNumber("8.0.0")) {
      return;
    }

    if (event.experienceId.equals(mManifestId)) {
      try {
        RNObject rctDeviceEventEmitter = new RNObject("com.facebook.react.modules.core.DeviceEventManagerModule$RCTDeviceEventEmitter");
        rctDeviceEventEmitter.loadVersion(mSDKVersion);

        mReactInstanceManager.callRecursive("getCurrentReactContext")
            .callRecursive("getJSModule", rctDeviceEventEmitter.rnClass())
            .call("emit", "Exponent.notification", event.toWriteableMap(mSDKVersion, "received"));
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
          rctDeviceEventEmitter.loadVersion(mSDKVersion);

          mReactInstanceManager.callRecursive("getCurrentReactContext")
              .callRecursive("getJSModule", rctDeviceEventEmitter.rnClass())
              .call("emit", "Exponent.openUri", uri);
        }
      }

      if ((options.notification != null || options.notificationObject != null) && mSDKVersion != null) {
        if (ABIVersion.toNumber(mSDKVersion) < ABIVersion.toNumber("8.0.0")) {
          // TODO: kill
          RNObject rctDeviceEventEmitter = new RNObject("com.facebook.react.modules.core.DeviceEventManagerModule$RCTDeviceEventEmitter");
          rctDeviceEventEmitter.loadVersion(mSDKVersion);

          mReactInstanceManager.callRecursive("getCurrentReactContext")
              .callRecursive("getJSModule", rctDeviceEventEmitter.rnClass())
              .call("emit", "Exponent.notification", options.notification);
        } else {
          RNObject rctDeviceEventEmitter = new RNObject("com.facebook.react.modules.core.DeviceEventManagerModule$RCTDeviceEventEmitter");
          rctDeviceEventEmitter.loadVersion(mSDKVersion);

          mReactInstanceManager.callRecursive("getCurrentReactContext")
              .callRecursive("getJSModule", rctDeviceEventEmitter.rnClass())
              .call("emit", "Exponent.notification", options.notificationObject.toWriteableMap(mSDKVersion, "selected"));
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

  @Override
  public boolean isDebugModeEnabled() {
    try {
      return mExponentSharedPreferences.isDebugModeEnabled() ||
          (mManifest != null &&
          mManifest.has(ExponentManifest.MANIFEST_DEVELOPER_KEY) &&
          mManifest.has(ExponentManifest.MANIFEST_PACKAGER_OPTS_KEY) &&
          mManifest.getJSONObject(ExponentManifest.MANIFEST_PACKAGER_OPTS_KEY)
              .optBoolean(ExponentManifest.MANIFEST_PACKAGER_OPTS_DEV_KEY, false));
    } catch (JSONException e) {
      return false;
    }
  }

  private void waitForDrawOverOtherAppPermission(String jsBundlePath, ExponentNotification notificationObject) {
    mJSBundlePath = jsBundlePath;
    mNotification = notificationObject;

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      if (isDebugModeEnabled() && !Settings.canDrawOverlays(this)) {
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
    }

    startReactInstance();
  }

  private void startReactInstance() {
    mReactInstanceManager = Exponent.getInstance().startReactInstance(this, this, mManifestUrl, mIntentUri, mJSBundlePath, mLinkingPackage, mManifest, mSDKVersion, mNotification, mIsShellApp, mExponentSharedPreferences, mReactRootView, mActivityId, mIsCrashed, null);
  }

  @Override
  public void handleUnreadNotifications(JSONArray unreadNotifications) {
    ExponentGcmListenerService gcmListenerService = ExponentGcmListenerService.getInstance();
    if (gcmListenerService != null) {
      gcmListenerService.removeNotifications(unreadNotifications);
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

    if (mManifest.optBoolean(ExponentManifest.MANIFEST_HIDE_EXPONENT_NOTIFICATION_KEY) && mIsShellApp) {
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

    boolean isAnimated = false;
    if (options != null) {
      try {
        if (options.getBoolean(KernelConstants.OPTION_LOAD_NUX_KEY)) {
          isAnimated = true;
        }
      } catch (JSONException e) {
        EXL.e(TAG, e.getMessage());
      }
    }

    // Build the actual notification
    final NotificationManager notificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
    notificationManager.cancel(NOTIFICATION_ID);
    mNotificationBuilder = new Notification.Builder(this)
        .setContent(mNotificationRemoteViews)
        .setSmallIcon(R.drawable.notification_icon)
        .setShowWhen(false)
        .setOngoing(true)
        .setPriority(Notification.PRIORITY_MAX);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      mNotificationBuilder.setColor(ContextCompat.getColor(this, R.color.colorPrimary));
    }
    notificationManager.notify(NOTIFICATION_ID, mNotificationBuilder.build());

    // Animate the notification
    setIsNotificationAnimated(isAnimated);
  }

  private void setIsNotificationAnimated(boolean isAnimated) {
    try {
      if (isAnimated) {
        if (mNotificationRemoteViews != null && mNotificationBuilder != null) {
          mNotificationBuilder.setOngoing(true);
          mNotificationAnimationFrame = 0;
          mNotificationAnimationHandler = new Handler();
          mNotificationAnimator = new Runnable() {
            @Override
            public void run() {
              if (mNotificationAnimator == null) {
                return;
              }
              animateNotificationToFrame(mNotificationAnimationFrame);

              mNotificationAnimationFrame++;
              mNotificationAnimationFrame %= 2;

              mNotificationAnimationHandler.postDelayed(mNotificationAnimator, 500);
            }
          };
          mNotificationAnimator.run();
        }
      } else {
        // reset to initial state
        animateNotificationToFrame(0);

        if (mNotificationAnimationHandler != null) {
          mNotificationAnimationHandler.removeCallbacks(mNotificationAnimator);
          mNotificationAnimator = null;
          mNotificationAnimationHandler = null;
        }
        if (mNotificationBuilder != null) {
          mNotificationBuilder.setOngoing(false);
        }
      }
    } catch (Throwable e) {
      EXL.e(TAG, e);
    }
  }

  private void animateNotificationToFrame(int frame) {
    if (mNotificationRemoteViews == null || mNotificationBuilder == null) {
      return;
    }

    int resId = (frame == 0) ? R.drawable.pin_white : R.drawable.pin_white_fade;
    mNotificationRemoteViews.setImageViewResource(R.id.save_button, resId);
    ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(NOTIFICATION_ID, mNotificationBuilder.build());
  }

  private void removeNotification() {
    setIsNotificationAnimated(false);
    mNotificationRemoteViews = null;
    mNotificationBuilder = null;
    removeNotification(this);
  }

  private void handleExperienceOptions(JSONObject options) {
    if (options != null) {
      try {
        if (options.getBoolean(KernelConstants.OPTION_LOAD_NUX_KEY)) {
          addNuxView();
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
        Amplitude.getInstance().logEvent("NUX_EXPERIENCE_OVERLAY_SHOWN");
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
    setIsNotificationAnimated(false);

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
              Amplitude.getInstance().logEvent("NUX_EXPERIENCE_OVERLAY_DISMISSED", eventProperties);
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
  protected boolean shouldShowErrorScreen(ExponentErrorMessage errorMessage) {
    long currentTime = System.currentTimeMillis();
    if (!mIsShellApp || mManifestUrl == null ||
        (sLastErrorRefreshTime != null && currentTime - sLastErrorRefreshTime < MIN_TIME_BETWEEN_ERROR_REFRESHES)) {
      return true;
    } else {
      sLastErrorRefreshTime = currentTime;

      try {
        JSONObject eventProperties = new JSONObject();
        eventProperties.put(Analytics.USER_ERROR_MESSAGE, errorMessage.userErrorMessage());
        eventProperties.put(Analytics.DEVELOPER_ERROR_MESSAGE, errorMessage.developerErrorMessage());
        eventProperties.put(Analytics.MANIFEST_URL, mManifestUrl);
        Amplitude.getInstance().logEvent(Analytics.ERROR_RELOADED, eventProperties);
      } catch (Exception e) {
        EXL.e(TAG, e.getMessage());
      }

      sErrorQueue.clear();
      mKernel.reloadVisibleExperience(mManifestUrl);
      return false;
    }
  }

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
