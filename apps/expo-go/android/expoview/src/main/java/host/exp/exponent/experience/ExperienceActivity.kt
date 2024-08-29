// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.experience

import android.app.AlertDialog
import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.animation.AccelerateInterpolator
import android.view.animation.AlphaAnimation
import android.view.animation.Animation
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.soloader.SoLoader
import com.google.firebase.crashlytics.FirebaseCrashlytics
import de.greenrobot.event.EventBus
import expo.modules.core.interfaces.Package
import expo.modules.manifests.core.Manifest
import expo.modules.splashscreen.singletons.SplashScreen
import host.exp.exponent.*
import host.exp.exponent.ExpoUpdatesAppLoader.AppLoaderCallback
import host.exp.exponent.ExpoUpdatesAppLoader.AppLoaderStatus
import host.exp.exponent.analytics.EXL
import host.exp.exponent.branch.BranchManager
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.experience.loading.LoadingProgressPopupController
import host.exp.exponent.experience.splashscreen.ManagedAppSplashScreenConfiguration
import host.exp.exponent.experience.splashscreen.ManagedAppSplashScreenViewController
import host.exp.exponent.experience.splashscreen.ManagedAppSplashScreenViewProvider
import host.exp.exponent.kernel.*
import host.exp.exponent.kernel.Kernel.KernelStartedRunningEvent
import host.exp.exponent.kernel.KernelConstants.ExperienceOptions
import host.exp.exponent.notifications.*
import host.exp.exponent.storage.ExponentDB
import host.exp.exponent.storage.ExponentDBObject
import host.exp.exponent.utils.AsyncCondition
import host.exp.exponent.utils.AsyncCondition.AsyncConditionListener
import host.exp.exponent.utils.ExperienceActivityUtils
import host.exp.exponent.utils.ExperienceRTLManager
import host.exp.exponent.utils.ExpoActivityIds
import host.exp.expoview.Exponent
import host.exp.expoview.Exponent.StartReactInstanceDelegate
import host.exp.expoview.R
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import versioned.host.exp.exponent.ExponentPackageDelegate
import versioned.host.exp.exponent.ReactUnthemedRootView
import java.lang.ref.WeakReference
import javax.inject.Inject

open class ExperienceActivity : BaseExperienceActivity(), StartReactInstanceDelegate {
  open fun expoPackages(): List<Package>? {
    // Experience must pick its own modules in ExponentPackage
    return null
  }

  open fun reactPackages(): List<ReactPackage>? {
    return null
  }

  override val exponentPackageDelegate: ExponentPackageDelegate? = null

  private var nuxOverlayView: ReactUnthemedRootView? = null
  private var notification: ExponentNotification? = null
  private var tempNotification: ExponentNotification? = null
  protected var intentUri: String? = null
  private var isReadyForBundle = false
  private var notificationRemoteViews: RemoteViews? = null
  private var notificationBuilder: NotificationCompat.Builder? = null
  private var isLoadExperienceAllowedToRun = false
  private var shouldShowLoadingViewWithOptimisticManifest = false

  /**
   * Controls loadingProgressPopupWindow that is shown above whole activity.
   */
  lateinit var loadingProgressPopupController: LoadingProgressPopupController
  var managedAppSplashScreenViewProvider: ManagedAppSplashScreenViewProvider? = null
  var managedAppSplashScreenViewController: ManagedAppSplashScreenViewController? = null

  @Inject
  lateinit var exponentManifest: ExponentManifest

  @Inject
  lateinit var devMenuManager: DevMenuManager

  private val devBundleDownloadProgressListener: DevBundleDownloadProgressListener =
    object : DevBundleDownloadProgressListener {
      override fun onProgress(status: String?, done: Int?, total: Int?) {
        UiThreadUtil.runOnUiThread {
          loadingProgressPopupController.updateProgress(
            status,
            done,
            total
          )
        }
      }

      override fun onSuccess() {
        UiThreadUtil.runOnUiThread {
          loadingProgressPopupController.hide()
          managedAppSplashScreenViewController?.startSplashScreenWarningTimer()
          finishLoading()
        }
      }

      override fun onFailure(error: Exception) {
        UiThreadUtil.runOnUiThread {
          loadingProgressPopupController.hide()
          interruptLoading()
        }
      }
    }

  /*
   *
   * Lifecycle
   *
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    isLoadExperienceAllowedToRun = true
    shouldShowLoadingViewWithOptimisticManifest = true
    loadingProgressPopupController = LoadingProgressPopupController(this)

    NativeModuleDepsProvider.instance.inject(ExperienceActivity::class.java, this)
    EventBus.getDefault().registerSticky(this)

    activityId = ExpoActivityIds.getNextAppActivityId()

    // TODO: audit this now that kernel logic is on the native side in Kotlin
    var shouldOpenImmediately = true

    // If our activity was killed for memory reasons or because of "Don't keep activities",
    // try to reload manifest using the savedInstanceState
    if (savedInstanceState != null) {
      val manifestUrl = savedInstanceState.getString(KernelConstants.MANIFEST_URL_KEY)
      if (manifestUrl != null) {
        this.manifestUrl = manifestUrl
      }
    }

    // On cold boot to experience, we're given this information from the Kotlin kernel, instead of
    // the JS kernel.
    val bundle = intent.extras
    if (bundle != null && this.manifestUrl == null) {
      val manifestUrl = bundle.getString(KernelConstants.MANIFEST_URL_KEY)
      if (manifestUrl != null) {
        this.manifestUrl = manifestUrl
      }

      // Don't want to get here if savedInstanceState has manifestUrl. Only care about
      // IS_OPTIMISTIC_KEY the first time onCreate is called.
      val isOptimistic = bundle.getBoolean(KernelConstants.IS_OPTIMISTIC_KEY)
      if (isOptimistic) {
        shouldOpenImmediately = false
      }
    }

    FirebaseCrashlytics.getInstance().log("ExperienceActivity.manifestUrl: ${this.manifestUrl}")
    if (this.manifestUrl != null && shouldOpenImmediately) {
      val forceCache = intent.getBooleanExtra(KernelConstants.LOAD_FROM_CACHE_KEY, false)
      ExpoUpdatesAppLoader(
        this.manifestUrl!!,
        object : AppLoaderCallback {
          override fun onOptimisticManifest(optimisticManifest: Manifest) {
            Exponent.instance.runOnUiThread { setOptimisticManifest(optimisticManifest) }
          }

          override fun onManifestCompleted(manifest: Manifest) {
            Exponent.instance.runOnUiThread {
              try {
                val bundleUrl = ExponentUrls.toHttp(manifest.getBundleURL())
                setManifest(this@ExperienceActivity.manifestUrl!!, manifest, bundleUrl)
              } catch (e: JSONException) {
                kernel.handleError(e)
              }
            }
          }

          override fun onBundleCompleted(localBundlePath: String) {
            Exponent.instance.runOnUiThread { setBundle(localBundlePath) }
          }

          override fun emitEvent(params: JSONObject) {
            emitUpdatesEvent(params)
          }

          override fun updateStatus(status: AppLoaderStatus?) {
            setLoadingProgressStatusIfEnabled(status)
          }

          override fun onError(e: Exception) {
            Exponent.instance.runOnUiThread { kernel.handleError(e) }
          }
        },
        forceCache
      ).start(this)
    }
    kernel.setOptimisticActivity(this, taskId)
  }

  override fun onResume() {
    super.onResume()
    currentActivity = this

    // Resume home's host if needed.
    devMenuManager.maybeResumeHostWithActivity(this)

    soLoaderInit()

    addNotification()
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    // Check for manifest to avoid calling this when first loading an experience
    if (hasFocus && manifest != null) {
      runOnUiThread { ExperienceActivityUtils.setNavigationBar(manifest!!, this@ExperienceActivity) }
    }
  }

  private fun soLoaderInit() {
    if (detachSdkVersion != null) {
      SoLoader.init(this, false)
    }
  }

  open fun shouldCheckOptions() {
    if (manifestUrl != null && kernel.hasOptionsForManifestUrl(manifestUrl)) {
      handleOptions(kernel.popOptionsForManifestUrl(manifestUrl)!!)
    }
  }

  override fun onPause() {
    super.onPause()
    if (currentActivity === this) {
      currentActivity = null
    }
    removeNotification()
  }

  public override fun onSaveInstanceState(savedInstanceState: Bundle) {
    savedInstanceState.putString(KernelConstants.MANIFEST_URL_KEY, manifestUrl)
    super.onSaveInstanceState(savedInstanceState)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    val uri = intent.data
    if (uri != null) {
      handleUri(uri.toString())
    }
  }

  fun toggleDevMenu(): Boolean {
    if (reactInstanceManager.isNotNull && !isCrashed) {
      devMenuManager.toggleInActivity(this)
      return true
    }
    return false
  }

  /**
   * Handles command line command `adb shell input keyevent 82` that toggles the dev menu on the current experience activity.
   */
  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    if (keyCode == KeyEvent.KEYCODE_MENU && reactInstanceManager.isNotNull && !isCrashed) {
      devMenuManager.toggleInActivity(this)
      return true
    }
    return super.onKeyUp(keyCode, event)
  }

  /**
   * Closes the dev menu when pressing back button when it is visible on this activity.
   */
  override fun onBackPressed() {
    if (currentActivity === this && devMenuManager.isShownInActivity(this)) {
      devMenuManager.requestToClose(this)
      return
    }
    super.onBackPressed()
  }

  fun onEventMainThread(event: KernelStartedRunningEvent?) {
    AsyncCondition.notify(KERNEL_STARTED_RUNNING_KEY)
  }

  override fun onDoneLoading() {
  }

  fun onEvent(event: ExperienceDoneLoadingEvent) {
    if (event.activity === this) {
      loadingProgressPopupController.hide()
    }

    val appLoader = kernel.getAppLoaderForManifestUrl(manifestUrl)
    if (appLoader != null && !appLoader.isUpToDate && appLoader.shouldShowAppLoaderStatus) {
      AlertDialog.Builder(this@ExperienceActivity)
        .setTitle("Using a cached project")
        .setMessage("Expo was unable to fetch the latest update to this app. A previously downloaded version has been launched. If you did not intend to use a cached project, check your network connection and reload the app.")
        .setPositiveButton("Use cache", null)
        .setNegativeButton("Reload") { _, _ ->
          kernel.reloadVisibleExperience(
            manifestUrl!!,
            false
          )
        }
        .show()
    }
  }

  /*
   *
   * Experience Loading
   *
   */
  fun startLoading() {
    isLoading = true
    showOrReconfigureManagedAppSplashScreen(manifest)
    setLoadingProgressStatusIfEnabled()
  }

  /**
   * This method is being called twice:
   * - first time for optimistic manifest
   * - seconds time for real manifest
   */
  protected fun showOrReconfigureManagedAppSplashScreen(manifest: Manifest?) {
    if (!shouldCreateLoadingView()) {
      return
    }

    hideLoadingView()
    if (managedAppSplashScreenViewProvider == null) {
      val config = ManagedAppSplashScreenConfiguration.parseManifest(
        manifest!!
      )
      managedAppSplashScreenViewProvider = ManagedAppSplashScreenViewProvider(config)
      val splashScreenView = managedAppSplashScreenViewProvider!!.createSplashScreenView(this)
      managedAppSplashScreenViewController = ManagedAppSplashScreenViewController(
        this,
        getRootViewClass(
          manifest
        ),
        splashScreenView
      )
      SplashScreen.show(this, managedAppSplashScreenViewController!!, true)
    } else {
      managedAppSplashScreenViewProvider!!.updateSplashScreenViewWithManifest(this, manifest!!)
    }
  }

  fun setLoadingProgressStatusIfEnabled() {
    val appLoader = kernel.getAppLoaderForManifestUrl(manifestUrl)
    if (appLoader != null) {
      setLoadingProgressStatusIfEnabled(appLoader.status)
    }
  }

  fun setLoadingProgressStatusIfEnabled(status: AppLoaderStatus?) {
    if (status == null) {
      return
    }
    val appLoader = kernel.getAppLoaderForManifestUrl(manifestUrl)
    if (appLoader != null && appLoader.shouldShowAppLoaderStatus) {
      UiThreadUtil.runOnUiThread { loadingProgressPopupController.setLoadingProgressStatus(status) }
    } else {
      UiThreadUtil.runOnUiThread { loadingProgressPopupController.hide() }
    }
  }

  fun setOptimisticManifest(optimisticManifest: Manifest) {
    runOnUiThread {
      if (!isInForeground) {
        return@runOnUiThread
      }
      if (!shouldShowLoadingViewWithOptimisticManifest) {
        return@runOnUiThread
      }
      ExperienceActivityUtils.configureStatusBar(optimisticManifest, this@ExperienceActivity)
      ExperienceActivityUtils.setNavigationBar(optimisticManifest, this@ExperienceActivity)
      ExperienceActivityUtils.setTaskDescription(
        exponentManifest,
        optimisticManifest,
        this@ExperienceActivity
      )
      showOrReconfigureManagedAppSplashScreen(optimisticManifest)
      setLoadingProgressStatusIfEnabled()
      ExperienceRTLManager.setRTLPreferencesFromManifest(this, optimisticManifest)
    }
  }

  fun setManifest(
    manifestUrl: String,
    manifest: Manifest,
    bundleUrl: String
  ) {
    if (!isInForeground) {
      return
    }
    if (!isLoadExperienceAllowedToRun) {
      return
    }

    // Only want to run once per onCreate. There are some instances with ShellAppActivity where this would be called
    // twice otherwise. Turn on "Don't keep activities", trigger a notification, background the app, and then
    // press on the notification in a shell app to see this happen.
    isLoadExperienceAllowedToRun = false

    isReadyForBundle = false
    this.manifestUrl = manifestUrl
    this.manifest = manifest

    exponentSharedPreferences.removeLegacyManifest(this.manifestUrl!!)

    // Notifications logic uses this to determine which experience to route a notification to
    ExponentDB.saveExperience(ExponentDBObject(this.manifestUrl!!, manifest, bundleUrl))

    ExponentNotificationManager(this).maybeCreateNotificationChannelGroup(this.manifest!!)

    val task = kernel.getExperienceActivityTask(this.manifestUrl!!)
    task.taskId = taskId
    task.experienceActivity = WeakReference(this)
    task.activityId = activityId
    task.bundleUrl = bundleUrl

    sdkVersion = manifest.getExpoGoSDKVersion()

    // Sometime we want to release a new version without adding a new .aar. Use TEMPORARY_SDK_VERSION
    // to point to the unversioned code in ReactAndroid.
    if (Constants.SDK_VERSION == sdkVersion) {
      sdkVersion = RNObject.UNVERSIONED
    }

    // In detach/shell, we always use UNVERSIONED as the ABI.
    detachSdkVersion = sdkVersion

    if (RNObject.UNVERSIONED != sdkVersion) {
      val isValidVersion = sdkVersion == Constants.SDK_VERSION
      if (!isValidVersion) {
        KernelProvider.instance.handleError(
          sdkVersion + " is not a valid SDK version. Only ${Constants.SDK_VERSION} is supported."
        )
        return
      }
    }

    soLoaderInit()

    try {
      experienceKey = ExperienceKey.fromManifest(manifest)
      AsyncCondition.notify(KernelConstants.EXPERIENCE_ID_SET_FOR_ACTIVITY_KEY)
    } catch (e: JSONException) {
      KernelProvider.instance.handleError("No ID found in manifest.")
      return
    }

    isCrashed = false

    ExperienceActivityUtils.updateOrientation(this.manifest!!, this)
    ExperienceActivityUtils.updateSoftwareKeyboardLayoutMode(this.manifest!!, this)
    ExperienceActivityUtils.overrideUiMode(this.manifest!!, this)

    addNotification()

    var notificationObject: ExponentNotification? = null
    // Activity could be restarted due to Dark Mode change, only pop options if that will not happen
    if (kernel.hasOptionsForManifestUrl(manifestUrl)) {
      val options = kernel.popOptionsForManifestUrl(manifestUrl)

      // if the kernel has an intent for our manifest url, that's the intent that triggered
      // the loading of this experience.
      if (options!!.uri != null) {
        intentUri = options.uri
      }
      notificationObject = options.notificationObject
    }

    BranchManager.handleLink(this, intentUri)

    ExperienceRTLManager.setRTLPreferencesFromManifest(this, manifest)

    runOnUiThread {
      if (!isInForeground) {
        return@runOnUiThread
      }
      if (reactInstanceManager.isNotNull) {
        reactInstanceManager.onHostDestroy()
        reactInstanceManager.assign(null)
      }

      reactRootView = RNObject("host.exp.exponent.ReactUnthemedRootView")
      reactRootView.loadVersion(detachSdkVersion!!).construct(this@ExperienceActivity)
      setReactRootView((reactRootView.get() as View))

      if (isDebugModeEnabled) {
        notification = notificationObject
        jsBundlePath = ""
        startReactInstance()
      } else {
        tempNotification = notificationObject
        isReadyForBundle = true
        AsyncCondition.notify(READY_FOR_BUNDLE)
      }

      ExperienceActivityUtils.configureStatusBar(manifest, this@ExperienceActivity)
      ExperienceActivityUtils.setNavigationBar(manifest, this@ExperienceActivity)
      ExperienceActivityUtils.setTaskDescription(
        exponentManifest,
        manifest,
        this@ExperienceActivity
      )
      showOrReconfigureManagedAppSplashScreen(manifest)
      setLoadingProgressStatusIfEnabled()
    }
  }

  fun setBundle(localBundlePath: String) {
    // by this point, setManifest should have also been called, so prevent
    // setOptimisticManifest from showing a rogue splash screen
    shouldShowLoadingViewWithOptimisticManifest = false
    if (!isDebugModeEnabled) {
      val finalIsReadyForBundle = isReadyForBundle
      AsyncCondition.wait(
        READY_FOR_BUNDLE,
        object : AsyncConditionListener {
          override fun isReady(): Boolean {
            return finalIsReadyForBundle
          }

          override fun execute() {
            notification = tempNotification
            tempNotification = null
            jsBundlePath = localBundlePath
            startReactInstance()
            AsyncCondition.remove(READY_FOR_BUNDLE)
          }
        }
      )
    }
  }

  fun onEventMainThread(event: ReceivedNotificationEvent) {
    // TODO(wschurman): investigate removal, this probably is no longer used
    if (experienceKey != null && event.experienceScopeKey == experienceKey!!.scopeKey) {
      try {
        val rctDeviceEventEmitter =
          RNObject("com.facebook.react.modules.core.DeviceEventManagerModule\$RCTDeviceEventEmitter")
        rctDeviceEventEmitter.loadVersion(detachSdkVersion!!)
        reactInstanceManager.callRecursive("getCurrentReactContext")!!
          .callRecursive("getJSModule", rctDeviceEventEmitter.rnClass())!!
          .call("emit", "Exponent.notification", event.toWriteableMap(detachSdkVersion, "received"))
      } catch (e: Throwable) {
        EXL.e(TAG, e)
      }
    }
  }

  fun handleOptions(options: ExperienceOptions) {
    try {
      val uri = options.uri
      if (uri !== null) {
        handleUri(uri)
        val rctDeviceEventEmitter =
          RNObject("com.facebook.react.modules.core.DeviceEventManagerModule\$RCTDeviceEventEmitter")
        rctDeviceEventEmitter.loadVersion(detachSdkVersion!!)
        reactInstanceManager.callRecursive("getCurrentReactContext")!!
          .callRecursive("getJSModule", rctDeviceEventEmitter.rnClass())!!
          .call("emit", "Exponent.openUri", uri)
        BranchManager.handleLink(this, uri)
      }
      if ((options.notification != null || options.notificationObject != null) && detachSdkVersion != null) {
        val rctDeviceEventEmitter =
          RNObject("com.facebook.react.modules.core.DeviceEventManagerModule\$RCTDeviceEventEmitter")
        rctDeviceEventEmitter.loadVersion(detachSdkVersion!!)
        reactInstanceManager.callRecursive("getCurrentReactContext")!!
          .callRecursive("getJSModule", rctDeviceEventEmitter.rnClass())!!
          .call(
            "emit",
            "Exponent.notification",
            options.notificationObject!!.toWriteableMap(detachSdkVersion, "selected")
          )
      }
    } catch (e: Throwable) {
      EXL.e(TAG, e)
    }
  }

  private fun handleUri(uri: String) {
    // Emits a "url" event to the Linking event emitter
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri))
    super.onNewIntent(intent)
  }

  fun emitUpdatesEvent(params: JSONObject) {
    KernelProvider.instance.addEventForExperience(
      manifestUrl!!,
      KernelConstants.ExperienceEvent(ExpoUpdatesAppLoader.UPDATES_EVENT_NAME, params.toString())
    )
  }

  override val isDebugModeEnabled: Boolean
    get() = manifest?.isDevelopmentMode() ?: false

  override fun startReactInstance() {
    Exponent.instance
      .testPackagerStatus(
        isDebugModeEnabled,
        manifest!!,
        object : Exponent.PackagerStatusCallback {
          override fun onSuccess() {
            reactInstanceManager = startReactInstance(
              this@ExperienceActivity,
              intentUri,
              detachSdkVersion,
              notification,
              reactPackages(),
              expoPackages(),
              devBundleDownloadProgressListener
            )
          }

          override fun onFailure(errorMessage: String) {
            KernelProvider.instance.handleError(errorMessage)
          }
        }
      )
  }

  override fun handleUnreadNotifications(unreadNotifications: JSONArray) {
    PushNotificationHelper.instance.removeNotifications(this, unreadNotifications)
  }

  /*
   *
   * Notification
   *
   */
  private fun addNotification() {
    if (manifestUrl == null || manifest == null) {
      return
    }

    val name = manifest!!.getName() ?: return

    val remoteViews = RemoteViews(packageName, R.layout.notification)
    remoteViews.setCharSequence(R.id.home_text_button, "setText", name)

    // We're defaulting to the behaviour prior API 31 (mutable) even though Android recommends immutability
    val mutableFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0

    // Home
    val homeIntent = Intent(this, LauncherActivity::class.java)
    remoteViews.setOnClickPendingIntent(
      R.id.home_image_button,
      PendingIntent.getActivity(
        this,
        0,
        homeIntent,
        mutableFlag
      )
    )

    // Reload
    remoteViews.setOnClickPendingIntent(
      R.id.reload_button,
      PendingIntent.getService(
        this,
        0,
        ExponentIntentService.getActionReloadExperience(this, manifestUrl!!),
        PendingIntent.FLAG_UPDATE_CURRENT or mutableFlag
      )
    )

    notificationRemoteViews = remoteViews

    // Build the actual notification
    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.cancel(PERSISTENT_EXPONENT_NOTIFICATION_ID)

    ExponentNotificationManager(this).maybeCreateExpoPersistentNotificationChannel()
    notificationBuilder =
      NotificationCompat.Builder(this, NotificationConstants.NOTIFICATION_EXPERIENCE_CHANNEL_ID)
        .setContent(notificationRemoteViews)
        .setSmallIcon(R.drawable.notification_icon)
        .setShowWhen(false)
        .setOngoing(true)
        .setPriority(Notification.PRIORITY_MAX)
        .setColor(ContextCompat.getColor(this, R.color.colorPrimary))

    notificationManager.notify(PERSISTENT_EXPONENT_NOTIFICATION_ID, notificationBuilder!!.build())
  }

  fun removeNotification() {
    notificationRemoteViews = null
    notificationBuilder = null
    removeNotification(this)
  }

  fun onNotificationAction() {
    dismissNuxViewIfVisible(true)
  }

  /**
   * @param isFromNotification true if this is the result of the user taking an
   * action in the notification view.
   */
  fun dismissNuxViewIfVisible(isFromNotification: Boolean) {
    if (nuxOverlayView == null) {
      return
    }

    runOnUiThread {
      val fadeOut: Animation = AlphaAnimation(1f, 0f).apply {
        interpolator = AccelerateInterpolator()
        duration = 500
        setAnimationListener(object : Animation.AnimationListener {
          override fun onAnimationEnd(animation: Animation) {
            if (nuxOverlayView!!.parent != null) {
              (nuxOverlayView!!.parent as ViewGroup).removeView(nuxOverlayView)
            }
            nuxOverlayView = null
          }

          override fun onAnimationRepeat(animation: Animation) {}
          override fun onAnimationStart(animation: Animation) {}
        })
      }
      nuxOverlayView!!.startAnimation(fadeOut)
    }
  }

  /*
   *
   * Errors
   *
   */
  override fun onError(intent: Intent) {
    if (manifestUrl != null) {
      intent.putExtra(ErrorActivity.MANIFEST_URL_KEY, manifestUrl)
    }
  }

  companion object {
    private val TAG = ExperienceActivity::class.java.simpleName
    private const val KERNEL_STARTED_RUNNING_KEY = "experienceActivityKernelDidLoad"
    const val PERSISTENT_EXPONENT_NOTIFICATION_ID = 10101
    private const val READY_FOR_BUNDLE = "readyForBundle"

    /**
     * Returns the currently active ExperienceActivity, that is the one that is currently being used by the user.
     */
    var currentActivity: ExperienceActivity? = null
      private set

    @JvmStatic fun removeNotification(context: Context) {
      val notificationManager =
        context.getSystemService(NOTIFICATION_SERVICE) as NotificationManager
      notificationManager.cancel(PERSISTENT_EXPONENT_NOTIFICATION_ID)
    }
  }
}
