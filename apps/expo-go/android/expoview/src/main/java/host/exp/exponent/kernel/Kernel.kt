// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel

import android.app.Activity
import android.app.ActivityManager
import android.app.ActivityManager.AppTask
import android.app.ActivityManager.RecentTaskInfo
import android.app.Application
import android.app.RemoteInput
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.nfc.NfcAdapter
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.core.os.bundleOf
import com.facebook.hermes.reactexecutor.HermesExecutorFactory
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.LifecycleState
import com.facebook.react.jscexecutor.JSCExecutorFactory
import com.facebook.react.modules.network.ReactCookieJarContainer
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers
import com.facebook.react.shell.MainReactPackage
import com.facebook.soloader.SoLoader
import de.greenrobot.event.EventBus
import expo.modules.jsonutils.require
import expo.modules.notifications.service.NotificationsService.Companion.getNotificationResponseFromOpenIntent
import expo.modules.notifications.service.delegates.ExpoHandlingDelegate
import expo.modules.manifests.core.Manifest
import expo.modules.manifests.core.ExpoUpdatesManifest
import host.exp.exponent.*
import host.exp.exponent.ExpoUpdatesAppLoader.AppLoaderCallback
import host.exp.exponent.ExpoUpdatesAppLoader.AppLoaderStatus
import host.exp.exponent.analytics.EXL
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.exceptions.ExceptionUtils
import host.exp.exponent.experience.BaseExperienceActivity
import host.exp.exponent.experience.ErrorActivity
import host.exp.exponent.experience.ExperienceActivity
import host.exp.exponent.experience.HomeActivity
import host.exp.exponent.headless.InternalHeadlessAppLoader
import host.exp.exponent.kernel.ExponentErrorMessage.Companion.developerErrorMessage
import host.exp.exponent.kernel.ExponentKernelModuleProvider.KernelEventCallback
import host.exp.exponent.kernel.ExponentKernelModuleProvider.queueEvent
import host.exp.exponent.kernel.ExponentUrls.toHttp
import host.exp.exponent.kernel.KernelConstants.ExperienceOptions
import host.exp.exponent.network.ExponentNetwork
import host.exp.exponent.notifications.ExponentNotification
import host.exp.exponent.notifications.ExponentNotificationManager
import host.exp.exponent.notifications.NotificationActionCenter
import host.exp.exponent.notifications.ScopedNotificationsUtils
import host.exp.exponent.storage.ExponentDB
import host.exp.exponent.storage.ExponentSharedPreferences
import host.exp.exponent.utils.AsyncCondition
import host.exp.exponent.utils.AsyncCondition.AsyncConditionListener
import host.exp.expoview.BuildConfig
import host.exp.expoview.ExpoViewBuildConfig
import host.exp.expoview.Exponent
import host.exp.expoview.Exponent.BundleListener
import okhttp3.OkHttpClient
import org.json.JSONException
import org.json.JSONObject
import versioned.host.exp.exponent.ExpoReanimatedPackage
import versioned.host.exp.exponent.ExpoTurboPackage
import versioned.host.exp.exponent.ExponentPackage
import versioned.host.exp.exponent.ReactUnthemedRootView
import java.lang.ref.WeakReference
import java.util.*
import java.util.concurrent.TimeUnit
import javax.inject.Inject

// TOOD: need to figure out when we should reload the kernel js. Do we do it every time you visit
// the home screen? only when the app gets kicked out of memory?
class Kernel : KernelInterface() {
  class KernelStartedRunningEvent

  class ExperienceActivityTask(val manifestUrl: String) {
    var taskId = 0
    var experienceActivity: WeakReference<ExperienceActivity>? = null
    var activityId = 0
    var bundleUrl: String? = null
  }

  // React
  var reactInstanceManager: ReactInstanceManager? = null
    private set

  // Contexts
  @Inject
  lateinit var context: Context

  @Inject
  lateinit var applicationContext: Application

  @Inject
  lateinit var exponentManifest: ExponentManifest

  @Inject
  lateinit var exponentSharedPreferences: ExponentSharedPreferences

  @Inject
  lateinit var exponentNetwork: ExponentNetwork

  var activityContext: Activity? = null
    set(value) {
      if (value != null) {
        field = value
      }
    }

  private var optimisticActivity: ExperienceActivity? = null

  private var optimisticTaskId: Int? = null

  private fun experienceActivityTaskForTaskId(taskId: Int): ExperienceActivityTask? {
    return manifestUrlToExperienceActivityTask.values.find { it.taskId == taskId }
  }

  // Misc
  var isStarted = false
    private set
  private var hasError = false

  private fun updateKernelRNOkHttp() {
    val client = OkHttpClient.Builder()
      .connectTimeout(0, TimeUnit.MILLISECONDS)
      .readTimeout(0, TimeUnit.MILLISECONDS)
      .writeTimeout(0, TimeUnit.MILLISECONDS)
      .cookieJar(ReactCookieJarContainer())
      .cache(exponentNetwork.cache)

    if (BuildConfig.DEBUG) {
      // FIXME: 8/9/17
      // broke with lib versioning
      // clientBuilder.addNetworkInterceptor(new StethoInterceptor());
    }
    ReactNativeStaticHelpers.setExponentNetwork(exponentNetwork)
  }

  private val kernelInitialURL: String?
    get() {
      val activity = activityContext ?: return null
      val intent = activity.intent ?: return null
      val action = intent.action
      val uri = intent.data
      return if ((
        uri != null &&
          ((Intent.ACTION_VIEW == action) || (NfcAdapter.ACTION_NDEF_DISCOVERED == action))
        )
      ) {
        uri.toString()
      } else {
        null
      }
    }

  // Don't call this until a loading screen is up, since it has to do some work on the main thread.
  fun startJSKernel(activity: Activity?) {
    activityContext = activity
    SoLoader.init(context, false)
    synchronized(this) {
      if (isStarted && !hasError) {
        return
      }
      isStarted = true
    }
    hasError = false
    if (!exponentSharedPreferences.shouldUseEmbeddedKernel()) {
      try {
        // Make sure we can get the manifest successfully. This can fail in dev mode
        // if the kernel packager is not running.
        exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest
      } catch (e: Throwable) {
        Exponent.instance
          .runOnUiThread { // Hack to make this show up for a while. Can't use an Alert because LauncherActivity has a transparent theme. This should only be seen by internal developers.
            var i = 0
            while (i < 3) {
              Toast.makeText(
                activityContext,
                "Kernel manifest invalid. Make sure `expo start` is running inside of exponent/home and rebuild the app.",
                Toast.LENGTH_LONG
              ).show()
              i++
            }
          }
        return
      }
    }

    // On first run use the embedded kernel js but fire off a request for the new js in the background.
    val bundleUrlToLoad =
      bundleUrl + (if (ExpoViewBuildConfig.DEBUG) "" else "?versionName=" + ExpoViewKernel.instance.versionName)
    if (exponentSharedPreferences.shouldUseEmbeddedKernel()) {
      kernelBundleListener().onBundleLoaded(Constants.EMBEDDED_KERNEL_PATH)
    } else {
      var shouldNotUseKernelCache =
        exponentSharedPreferences.getBoolean(ExponentSharedPreferences.ExponentSharedPreferencesKey.SHOULD_NOT_USE_KERNEL_CACHE)
      if (!ExpoViewBuildConfig.DEBUG) {
        val oldKernelRevisionId =
          exponentSharedPreferences.getString(ExponentSharedPreferences.ExponentSharedPreferencesKey.KERNEL_REVISION_ID, "")
        if (oldKernelRevisionId != kernelRevisionId) {
          shouldNotUseKernelCache = true
        }
      }
      Exponent.instance.loadJSBundle(
        null,
        bundleUrlToLoad,
        bundleAssetRequestHeaders,
        KernelConstants.KERNEL_BUNDLE_ID,
        RNObject.UNVERSIONED,
        kernelBundleListener(),
        shouldNotUseKernelCache
      )
    }
  }

  private fun kernelBundleListener(): BundleListener {
    return object : BundleListener {
      override fun onBundleLoaded(localBundlePath: String) {
        if (!exponentSharedPreferences.shouldUseEmbeddedKernel() && !ExpoViewBuildConfig.DEBUG) {
          exponentSharedPreferences.setString(
            ExponentSharedPreferences.ExponentSharedPreferencesKey.KERNEL_REVISION_ID,
            kernelRevisionId
          )
        }
        Exponent.instance.runOnUiThread {
          val initialURL = kernelInitialURL
          val builder = ReactInstanceManager.builder()
            .setApplication(applicationContext)
            .setCurrentActivity(activityContext)
            .setJSBundleFile(localBundlePath)
            .setJavaScriptExecutorFactory(jsExecutorFactory)
            .addPackage(MainReactPackage())
            .addPackage(ExpoReanimatedPackage())
            .addPackage(
              ExponentPackage.kernelExponentPackage(
                context,
                exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest,
                HomeActivity.homeExpoPackages(),
                HomeActivity.Companion,
                initialURL
              )
            )
            .addPackage(
              ExpoTurboPackage.kernelExpoTurboPackage(
                exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest,
                initialURL
              )
            )
            .setInitialLifecycleState(LifecycleState.RESUMED)
          if (!KernelConfig.FORCE_NO_KERNEL_DEBUG_MODE && exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest.isDevelopmentMode()) {
            Exponent.enableDeveloperSupport(
              kernelDebuggerHost,
              kernelMainModuleName,
              RNObject.wrap(builder)
            )
          }
          reactInstanceManager = builder.build()
          reactInstanceManager!!.createReactContextInBackground()
          reactInstanceManager!!.onHostResume(activityContext, null)
          isRunning = true
          EventBus.getDefault().postSticky(KernelStartedRunningEvent())
          EXL.d(TAG, "Kernel started running.")

          // Reset this flag if we crashed
          exponentSharedPreferences.setBoolean(
            ExponentSharedPreferences.ExponentSharedPreferencesKey.SHOULD_NOT_USE_KERNEL_CACHE,
            false
          )
        }
      }

      override fun onError(e: Exception) {
        setHasError()
        if (ExpoViewBuildConfig.DEBUG) {
          handleError("Can't load kernel. Are you sure your packager is running and your phone is on the same wifi? " + e.message)
        } else {
          handleError("Expo requires an internet connection.")
          EXL.d(TAG, "Expo requires an internet connection." + e.message)
        }
      }
    }
  }

  private val kernelDebuggerHost: String
    get() = exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest.getDebuggerHost()
  private val kernelMainModuleName: String
    get() = exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest.getMainModuleName()
  private val bundleUrl: String?
    get() {
      return try {
        exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest.getBundleURL()
      } catch (e: JSONException) {
        KernelProvider.instance.handleError(e)
        null
      }
    }
  private val bundleAssetRequestHeaders: JSONObject
    get() {
      return try {
        val manifestAndAssetRequestHeaders = exponentManifest.getKernelManifestAndAssetRequestHeaders()
        val manifest = manifestAndAssetRequestHeaders.manifest
        if (manifest is ExpoUpdatesManifest) {
          val bundleKey = manifest.getLaunchAsset().getString("key")
          val map: Map<String, JSONObject> = manifestAndAssetRequestHeaders.assetRequestHeaders.let { it.keys().asSequence().associateWith { key -> it.require(key) } } ?: mapOf()
          map[bundleKey] ?: JSONObject()
        } else {
          JSONObject()
        }
      } catch (e: JSONException) {
        KernelProvider.instance.handleError(e)
        JSONObject()
      }
    }
  private val kernelRevisionId: String?
    get() {
      return try {
        exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest.getRevisionId()
      } catch (e: JSONException) {
        KernelProvider.instance.handleError(e)
        null
      }
    }
  var isRunning: Boolean = false
    get() = field && !hasError
    private set

  val reactRootView: ReactRootView
    get() {
      val reactRootView: ReactRootView = ReactUnthemedRootView(activityContext)
      reactRootView.startReactApplication(
        reactInstanceManager,
        KernelConstants.HOME_MODULE_NAME,
        kernelLaunchOptions
      )
      return reactRootView
    }
  private val kernelLaunchOptions = bundleOf(
    "exp" to Bundle()
  )
  private val jsExecutorFactory: JavaScriptExecutorFactory
    get() {
      val manifest = exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest
      val appName = manifest.getName() ?: ""
      val deviceName = AndroidInfoHelpers.getFriendlyDeviceName()

      val jsEngineFromManifest = manifest.jsEngine
      return if (jsEngineFromManifest == "hermes") {
        HermesExecutorFactory()
      } else {
        JSCExecutorFactory(
          appName,
          deviceName
        )
      }
    }

  fun hasOptionsForManifestUrl(manifestUrl: String?): Boolean {
    return manifestUrlToOptions.containsKey(manifestUrl)
  }

  fun popOptionsForManifestUrl(manifestUrl: String?): ExperienceOptions? {
    return manifestUrlToOptions.remove(manifestUrl)
  }

  fun addAppLoaderForManifestUrl(manifestUrl: String, appLoader: ExpoUpdatesAppLoader) {
    manifestUrlToAppLoader[manifestUrl] = appLoader
  }

  override fun getAppLoaderForManifestUrl(manifestUrl: String?): ExpoUpdatesAppLoader? {
    return manifestUrlToAppLoader[manifestUrl]
  }

  fun getExperienceActivityTask(manifestUrl: String): ExperienceActivityTask {
    var task = manifestUrlToExperienceActivityTask[manifestUrl]
    if (task != null) {
      return task
    }
    task = ExperienceActivityTask(manifestUrl)
    manifestUrlToExperienceActivityTask[manifestUrl] = task
    return task
  }

  fun removeExperienceActivityTask(manifestUrl: String?) {
    if (manifestUrl != null) {
      manifestUrlToExperienceActivityTask.remove(manifestUrl)
    }
  }

  fun openHomeActivity() {
    val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    for (task: AppTask in manager.appTasks) {
      val baseIntent = task.taskInfo.baseIntent
      if ((HomeActivity::class.java.name == baseIntent.component!!.className)) {
        task.moveToFront()
        return
      }
    }
    val intent = Intent(activityContext, HomeActivity::class.java)
    addIntentDocumentFlags(intent)
    activityContext!!.startActivity(intent)
  }

  private fun openShellAppActivity(forceCache: Boolean) {
    try {
      val activityClass = Class.forName("host.exp.exponent.MainActivity")
      val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
      for (task: AppTask in manager.appTasks) {
        val baseIntent = task.taskInfo.baseIntent
        if ((activityClass.name == baseIntent.component!!.className)) {
          moveTaskToFront(task.taskInfo.id)
          return
        }
      }
      val intent = Intent(activityContext, activityClass)
      addIntentDocumentFlags(intent)
      if (forceCache) {
        intent.putExtra(KernelConstants.LOAD_FROM_CACHE_KEY, true)
      }
      activityContext!!.startActivity(intent)
    } catch (e: ClassNotFoundException) {
      throw IllegalStateException("Could not find activity to open (MainActivity is not present).")
    }
  }

  /*
   *
   * Manifests
   *
   */
  fun handleIntent(activity: Activity, intent: Intent) {
    try {
      if (intent.getBooleanExtra("EXKernelDisableNuxDefaultsKey", false)) {
        Constants.DISABLE_NUX = true
      }
    } catch (e: Throwable) {
    }
    activityContext = activity
    if (intent.action != null && (ExpoHandlingDelegate.OPEN_APP_INTENT_ACTION == intent.action)) {
      if (!openExperienceFromNotificationIntent(intent)) {
        openDefaultUrl()
      }
      return
    }
    val bundle = intent.extras
    val uri = intent.data
    val intentUri = uri?.toString()
    if (bundle != null) {
      // Notification
      val notification = bundle.getString(KernelConstants.NOTIFICATION_KEY) // deprecated
      val notificationObject = bundle.getString(KernelConstants.NOTIFICATION_OBJECT_KEY)
      val notificationManifestUrl = bundle.getString(KernelConstants.NOTIFICATION_MANIFEST_URL_KEY)
      if (notificationManifestUrl != null) {
        val exponentNotification = ExponentNotification.fromJSONObjectString(notificationObject)
        if (exponentNotification != null) {
          // Add action type
          if (bundle.containsKey(KernelConstants.NOTIFICATION_ACTION_TYPE_KEY)) {
            exponentNotification.actionType = bundle.getString(KernelConstants.NOTIFICATION_ACTION_TYPE_KEY)
            val manager = ExponentNotificationManager(context)
            val experienceKey = ExperienceKey(exponentNotification.experienceScopeKey)
            manager.cancel(experienceKey, exponentNotification.notificationId)
          }
          // Add remote input
          val remoteInput = RemoteInput.getResultsFromIntent(intent)
          if (remoteInput != null) {
            exponentNotification.inputText = remoteInput.getString(NotificationActionCenter.KEY_TEXT_REPLY)
          }
        }
        openExperience(
          ExperienceOptions(
            notificationManifestUrl,
            intentUri ?: notificationManifestUrl,
            notification,
            exponentNotification
          )
        )
        return
      }

      // Shortcut
      // TODO: Remove once we decide to stop supporting shortcuts to experiences.
      val shortcutManifestUrl = bundle.getString(KernelConstants.SHORTCUT_MANIFEST_URL_KEY)
      if (shortcutManifestUrl != null) {
        openExperience(ExperienceOptions(shortcutManifestUrl, intentUri, null))
        return
      }
    }
    if (uri != null && shouldOpenUrl(uri)) {
      // We got an "exp://", "exps://", "http://", or "https://" app link
      openExperience(ExperienceOptions(uri.toString(), uri.toString(), null))
      return
    }
    openDefaultUrl()
  }

  // Certain links (i.e. 'expo.io/expo-go') should just open the HomeScreen
  private fun shouldOpenUrl(uri: Uri): Boolean {
    val host = uri.host ?: ""
    val path = uri.path ?: ""
    return !(((host == "expo.io") || (host == "expo.dev")) && (path == "/expo-go"))
  }

  private fun openExperienceFromNotificationIntent(intent: Intent): Boolean {
    val response = getNotificationResponseFromOpenIntent(intent)
    val experienceScopeKey = ScopedNotificationsUtils.getExperienceScopeKey(response) ?: return false
    val exponentDBObject = try {
      val exponentDBObjectInner = ExponentDB.experienceScopeKeyToExperienceSync(experienceScopeKey)
      if (exponentDBObjectInner == null) {
        Log.w("expo-notifications", "Couldn't find experience from scopeKey: $experienceScopeKey")
      }
      exponentDBObjectInner
    } catch (e: JSONException) {
      Log.w("expo-notifications", "Couldn't deserialize experience from scopeKey: $experienceScopeKey")
      null
    } ?: return false

    val manifestUrl = exponentDBObject.manifestUrl
    openExperience(ExperienceOptions(manifestUrl, manifestUrl, null))
    return true
  }

  private fun openDefaultUrl() {
    val defaultUrl = KernelConstants.HOME_MANIFEST_URL
    openExperience(ExperienceOptions(defaultUrl, defaultUrl, null))
  }

  override fun openExperience(options: ExperienceOptions) {
    openManifestUrl(getManifestUrlFromFullUri(options.manifestUri), options, true)
  }

  private fun getManifestUrlFromFullUri(uriString: String?): String? {
    if (uriString == null) {
      return null
    }

    val uri = Uri.parse(uriString)
    val builder = uri.buildUpon()
    val deepLinkPositionDashes =
      uriString.indexOf(ExponentManifest.DEEP_LINK_SEPARATOR_WITH_SLASH)
    if (deepLinkPositionDashes >= 0) {
      // do this safely so we preserve any query string
      val pathSegments = uri.pathSegments
      builder.path(null)
      for (segment: String in pathSegments) {
        if ((ExponentManifest.DEEP_LINK_SEPARATOR == segment)) {
          break
        }
        builder.appendEncodedPath(segment)
      }
    }

    // transfer the release-channel param to the built URL as this will cause Expo Go to treat
    // this as a different project
    var releaseChannel = uri.getQueryParameter(ExponentManifest.QUERY_PARAM_KEY_RELEASE_CHANNEL)
    builder.query(null)
    if (releaseChannel != null) {
      // release channels cannot contain the ' ' character, so if this is present,
      // it must be an encoded form of '+' which indicated a deep link in SDK <27.
      // therefore, nothing after this is part of the release channel name so we should strip it.
      // TODO: remove this check once SDK 26 and below are no longer supported
      val releaseChannelDeepLinkPosition = releaseChannel.indexOf(' ')
      if (releaseChannelDeepLinkPosition > -1) {
        releaseChannel = releaseChannel.substring(0, releaseChannelDeepLinkPosition)
      }
      builder.appendQueryParameter(
        ExponentManifest.QUERY_PARAM_KEY_RELEASE_CHANNEL,
        releaseChannel
      )
    }

    // transfer the expo-updates query params: runtime-version, channel-name
    val expoUpdatesQueryParameters = listOf(
      ExponentManifest.QUERY_PARAM_KEY_EXPO_UPDATES_RUNTIME_VERSION,
      ExponentManifest.QUERY_PARAM_KEY_EXPO_UPDATES_CHANNEL_NAME
    )
    for (queryParameter: String in expoUpdatesQueryParameters) {
      val queryParameterValue = uri.getQueryParameter(queryParameter)
      if (queryParameterValue != null) {
        builder.appendQueryParameter(queryParameter, queryParameterValue)
      }
    }

    // ignore fragments as well (e.g. those added by auth-session)
    builder.fragment(null)
    var newUriString = builder.build().toString()
    val deepLinkPositionPlus = newUriString.indexOf('+')
    if (deepLinkPositionPlus >= 0 && deepLinkPositionDashes < 0) {
      // need to keep this for backwards compatibility
      newUriString = newUriString.substring(0, deepLinkPositionPlus)
    }

    // manifest url doesn't have a trailing slash
    if (newUriString.isNotEmpty()) {
      val lastUrlChar = newUriString[newUriString.length - 1]
      if (lastUrlChar == '/') {
        newUriString = newUriString.substring(0, newUriString.length - 1)
      }
    }
    return newUriString
  }

  private fun openManifestUrl(
    manifestUrl: String?,
    options: ExperienceOptions?,
    isOptimistic: Boolean,
    forceCache: Boolean = false
  ) {
    SoLoader.init(context, false)
    if (options == null) {
      manifestUrlToOptions.remove(manifestUrl)
    } else {
      manifestUrlToOptions[manifestUrl] = options
    }
    if (manifestUrl == null || (manifestUrl == KernelConstants.HOME_MANIFEST_URL)) {
      openHomeActivity()
      return
    }

    ErrorActivity.clearErrorList()
    val tasks: List<AppTask> = experienceActivityTasks
    var existingTask: AppTask? = run {
      for (i in tasks.indices) {
        val task = tasks[i]
        // When deep linking from `NotificationForwarderActivity`, the task will finish immediately.
        // There is race condition to retrieve the taskInfo from the finishing task.
        // Uses try-catch to handle the cases.
        try {
          val baseIntent = task.taskInfo.baseIntent
          if (baseIntent.hasExtra(KernelConstants.MANIFEST_URL_KEY) && (
              baseIntent.getStringExtra(
                KernelConstants.MANIFEST_URL_KEY
              ) == manifestUrl
              )
          ) {
            return@run task
          }
        } catch (e: Exception) {}
      }
      return@run null
    }

    if (isOptimistic && existingTask == null) {
      openOptimisticExperienceActivity(manifestUrl)
    }
    if (existingTask != null) {
      try {
        moveTaskToFront(existingTask.taskInfo.id)
      } catch (e: IllegalArgumentException) {
        // Sometimes task can't be found.
        existingTask = null
        openOptimisticExperienceActivity(manifestUrl)
      }
    }
    val finalExistingTask = existingTask
    if (existingTask == null) {
      ExpoUpdatesAppLoader(
        manifestUrl,
        object : AppLoaderCallback {
          override fun onOptimisticManifest(optimisticManifest: Manifest) {
            Exponent.instance
              .runOnUiThread { sendOptimisticManifestToExperienceActivity(optimisticManifest) }
          }

          override fun onManifestCompleted(manifest: Manifest) {
            Exponent.instance.runOnUiThread {
              try {
                openManifestUrlStep2(manifestUrl, manifest, finalExistingTask)
              } catch (e: JSONException) {
                handleError(e)
              }
            }
          }

          override fun onBundleCompleted(localBundlePath: String) {
            Exponent.instance.runOnUiThread { sendBundleToExperienceActivity(localBundlePath) }
          }

          override fun emitEvent(params: JSONObject) {
            val task = manifestUrlToExperienceActivityTask[manifestUrl]
            if (task != null) {
              val experienceActivity = task.experienceActivity!!.get()
              experienceActivity?.emitUpdatesEvent(params)
            }
          }

          override fun updateStatus(status: AppLoaderStatus?) {
            if (optimisticActivity != null) {
              optimisticActivity!!.setLoadingProgressStatusIfEnabled(status)
            }
          }

          override fun onError(e: Exception) {
            Exponent.instance.runOnUiThread { handleError(e) }
          }
        },
        forceCache
      ).start(context)
    }
  }

  @Throws(JSONException::class)
  private fun openManifestUrlStep2(
    manifestUrl: String,
    manifest: Manifest,
    existingTask: AppTask?
  ) {
    val bundleUrl = toHttp(manifest.getBundleURL())
    val task = getExperienceActivityTask(manifestUrl)
    task.bundleUrl = bundleUrl
    if (existingTask == null) {
      sendManifestToExperienceActivity(manifestUrl, manifest, bundleUrl)
    }
    val params = Arguments.createMap().apply {
      putString("manifestUrl", manifestUrl)
      putString("manifestString", manifest.toString())
    }
    queueEvent(
      "ExponentKernel.addHistoryItem",
      params,
      object : KernelEventCallback {
        override fun onEventSuccess(result: ReadableMap) {
          EXL.d(TAG, "Successfully called ExponentKernel.addHistoryItem in kernel JS.")
        }

        override fun onEventFailure(errorMessage: String?) {
          EXL.e(TAG, "Error calling ExponentKernel.addHistoryItem in kernel JS: $errorMessage")
        }
      }
    )
    killOrphanedLauncherActivities()
  }

  /*
   *
   * Optimistic experiences
   *
   */
  private fun openOptimisticExperienceActivity(manifestUrl: String?) {
    try {
      val intent = Intent(activityContext, ExperienceActivity::class.java).apply {
        addIntentDocumentFlags(this)
        putExtra(KernelConstants.MANIFEST_URL_KEY, manifestUrl)
        putExtra(KernelConstants.IS_OPTIMISTIC_KEY, true)
      }
      activityContext!!.startActivity(intent)
    } catch (e: Throwable) {
      EXL.e(TAG, e)
    }
  }

  fun setOptimisticActivity(experienceActivity: ExperienceActivity, taskId: Int) {
    optimisticActivity = experienceActivity
    optimisticTaskId = taskId
    AsyncCondition.notify(KernelConstants.OPEN_OPTIMISTIC_EXPERIENCE_ACTIVITY_KEY)
    AsyncCondition.notify(KernelConstants.OPEN_EXPERIENCE_ACTIVITY_KEY)
  }

  fun sendOptimisticManifestToExperienceActivity(optimisticManifest: Manifest) {
    AsyncCondition.wait(
      KernelConstants.OPEN_OPTIMISTIC_EXPERIENCE_ACTIVITY_KEY,
      object : AsyncConditionListener {
        override fun isReady(): Boolean {
          return optimisticActivity != null && optimisticTaskId != null
        }

        override fun execute() {
          optimisticActivity!!.setOptimisticManifest(optimisticManifest)
        }
      }
    )
  }

  private fun sendManifestToExperienceActivity(
    manifestUrl: String,
    manifest: Manifest,
    bundleUrl: String
  ) {
    AsyncCondition.wait(
      KernelConstants.OPEN_EXPERIENCE_ACTIVITY_KEY,
      object : AsyncConditionListener {
        override fun isReady(): Boolean {
          return optimisticActivity != null && optimisticTaskId != null
        }

        override fun execute() {
          optimisticActivity!!.setManifest(manifestUrl, manifest, bundleUrl)
          AsyncCondition.notify(KernelConstants.LOAD_BUNDLE_FOR_EXPERIENCE_ACTIVITY_KEY)
        }
      }
    )
  }

  private fun sendBundleToExperienceActivity(localBundlePath: String) {
    AsyncCondition.wait(
      KernelConstants.LOAD_BUNDLE_FOR_EXPERIENCE_ACTIVITY_KEY,
      object : AsyncConditionListener {
        override fun isReady(): Boolean {
          return optimisticActivity != null && optimisticTaskId != null
        }

        override fun execute() {
          optimisticActivity!!.setBundle(localBundlePath)
          optimisticActivity = null
          optimisticTaskId = null
        }
      }
    )
  }

  /*
   *
   * Tasks
   *
   */
  val tasks: List<AppTask>
    get() {
      val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
      return manager.appTasks
    }

  // Get list of tasks in our format.
  val experienceActivityTasks: List<AppTask>
    get() = tasks

  // Sometimes LauncherActivity.finish() doesn't close the activity and task. Not sure why exactly.
  // Thought it was related to launchMode="singleTask" but other launchModes seem to have the same problem.
  // This can be reproduced by creating a shortcut, exiting app, clicking on shortcut, refreshing, pressing
  // home, clicking on shortcut, click recent apps button. There will be a blank LauncherActivity behind
  // the ExperienceActivity. killOrphanedLauncherActivities solves this but would be nice to figure out
  // the root cause.
  private fun killOrphanedLauncherActivities() {
    try {
      // Crash with NoSuchFieldException instead of hard crashing at taskInfo.numActivities
      RecentTaskInfo::class.java.getDeclaredField("numActivities")
      for (task: AppTask in tasks) {
        val taskInfo = task.taskInfo
        if (taskInfo.numActivities == 0 && (taskInfo.baseIntent.action == Intent.ACTION_MAIN)) {
          task.finishAndRemoveTask()
          return
        }
        if (taskInfo.numActivities == 1 && (taskInfo.topActivity!!.className == LauncherActivity::class.java.name)) {
          task.finishAndRemoveTask()
          return
        }
      }
    } catch (e: NoSuchFieldException) {
      // Don't EXL here because this isn't actually a problem
      Log.e(TAG, e.toString())
    } catch (e: Throwable) {
      EXL.e(TAG, e)
    }
  }

  fun moveTaskToFront(taskId: Int) {
    tasks.find { it.taskInfo.id == taskId }?.also { task ->
      // If we have the task in memory, tell the ExperienceActivity to check for new options.
      // Otherwise options will be added in initialProps when the Experience starts.
      val exponentTask = experienceActivityTaskForTaskId(taskId)
      if (exponentTask != null) {
        val experienceActivity = exponentTask.experienceActivity!!.get()
        experienceActivity?.shouldCheckOptions()
      }
      task.moveToFront()
    }
  }

  fun killActivityStack(activity: Activity) {
    val exponentTask = experienceActivityTaskForTaskId(activity.taskId)
    if (exponentTask != null) {
      removeExperienceActivityTask(exponentTask.manifestUrl)
    }

    // Kill the current task.
    val manager = activity.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    manager.appTasks.find { it.taskInfo.id == activity.taskId }?.also { task -> task.finishAndRemoveTask() }
  }

  override fun reloadVisibleExperience(manifestUrl: String, forceCache: Boolean): Boolean {
    var activity: ExperienceActivity? = null
    for (experienceActivityTask: ExperienceActivityTask in manifestUrlToExperienceActivityTask.values) {
      if (manifestUrl == experienceActivityTask.manifestUrl) {
        val weakActivity =
          if (experienceActivityTask.experienceActivity == null) {
            null
          } else {
            experienceActivityTask.experienceActivity!!.get()
          }
        activity = weakActivity
        if (weakActivity == null) {
          // No activity, just force a reload
          break
        }
        Exponent.instance.runOnUiThread { weakActivity.startLoading() }
        break
      }
    }
    activity?.let { killActivityStack(it) }
    openManifestUrl(manifestUrl, null, true, forceCache)
    return true
  }

  override fun handleError(errorMessage: String) {
    handleReactNativeError(developerErrorMessage(errorMessage), null, -1, true)
  }

  override fun handleError(exception: Exception) {
    handleReactNativeError(ExceptionUtils.exceptionToErrorMessage(exception), null, -1, true, ExceptionUtils.exceptionToErrorHeader(exception), ExceptionUtils.exceptionToCanRetry(exception))
  }

  // TODO: probably need to call this from other places.
  fun setHasError() {
    hasError = true
  }

  companion object {
    private val TAG = Kernel::class.java.simpleName
    private lateinit var instance: Kernel

    // Activities/Tasks
    private val manifestUrlToExperienceActivityTask = mutableMapOf<String, ExperienceActivityTask>()
    private val manifestUrlToOptions = mutableMapOf<String?, ExperienceOptions>()
    private val manifestUrlToAppLoader = mutableMapOf<String?, ExpoUpdatesAppLoader>()

    private fun addIntentDocumentFlags(intent: Intent) = intent.apply {
      addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
      addFlags(Intent.FLAG_ACTIVITY_NEW_DOCUMENT)
      addFlags(Intent.FLAG_ACTIVITY_MULTIPLE_TASK)
    }

    @JvmStatic
    @DoNotStrip
    fun reloadVisibleExperience(activityId: Int) {
      val manifestUrl = getManifestUrlForActivityId(activityId)
      if (manifestUrl != null) {
        instance.reloadVisibleExperience(manifestUrl, false)
      }
    }

    // Called from DevServerHelper via ReactNativeStaticHelpers
    @JvmStatic
    @DoNotStrip
    fun getManifestUrlForActivityId(activityId: Int): String? {
      return manifestUrlToExperienceActivityTask.values.find { it.activityId == activityId }?.manifestUrl
    }

    // Called from DevServerHelper via ReactNativeStaticHelpers
    @JvmStatic
    @DoNotStrip
    fun getBundleUrlForActivityId(
      activityId: Int,
      host: String,
      mainModuleId: String?,
      bundleTypeId: String?,
      devMode: Boolean,
      jsMinify: Boolean
    ): String? {
      // NOTE: This current implementation doesn't look at the bundleTypeId (see RN's private
      // BundleType enum for the possible values) but may need to
      if (activityId == -1) {
        // This is the kernel
        return instance.bundleUrl
      }
      if (InternalHeadlessAppLoader.hasBundleUrlForActivityId(activityId)) {
        return InternalHeadlessAppLoader.getBundleUrlForActivityId(activityId)
      }
      return manifestUrlToExperienceActivityTask.values.find { it.activityId == activityId }?.bundleUrl
    }

    // <= SDK 25
    @DoNotStrip
    fun getBundleUrlForActivityId(
      activityId: Int,
      host: String,
      jsModulePath: String?,
      devMode: Boolean,
      jsMinify: Boolean
    ): String? {
      if (activityId == -1) {
        // This is the kernel
        return instance.bundleUrl
      }
      return manifestUrlToExperienceActivityTask.values.find { it.activityId == activityId }?.bundleUrl
    }

    // <= SDK 21
    @DoNotStrip
    fun getBundleUrlForActivityId(
      activityId: Int,
      host: String,
      jsModulePath: String?,
      devMode: Boolean,
      hmr: Boolean,
      jsMinify: Boolean
    ): String? {
      if (activityId == -1) {
        // This is the kernel
        return instance.bundleUrl
      }
      return manifestUrlToExperienceActivityTask.values.find { it.activityId == activityId }?.let { task ->
        var url = task.bundleUrl ?: return null
        if (hmr) {
          url = if (url.contains("hot=false")) {
            url.replace("hot=false", "hot=true")
          } else {
            "$url&hot=true"
          }
        }
        return url
      }
    }

    /*
     *
     * Error handling
     *
     */
    // Called using reflection from ReactAndroid.
    @DoNotStrip
    fun handleReactNativeError(
      errorMessage: String?,
      detailsUnversioned: Any?,
      exceptionId: Int?,
      isFatal: Boolean
    ) {
      handleReactNativeError(
        developerErrorMessage(errorMessage),
        detailsUnversioned,
        exceptionId,
        isFatal
      )
    }

    // Called using reflection from ReactAndroid.
    @DoNotStrip
    fun handleReactNativeError(
      throwable: Throwable?,
      errorMessage: String?,
      detailsUnversioned: Any?,
      exceptionId: Int?,
      isFatal: Boolean
    ) {
      handleReactNativeError(
        developerErrorMessage(errorMessage),
        detailsUnversioned,
        exceptionId,
        isFatal
      )
    }

    private fun handleReactNativeError(
      errorMessage: ExponentErrorMessage,
      detailsUnversioned: Any?,
      exceptionId: Int?,
      isFatal: Boolean,
      errorHeader: String? = null,
      canRetry: Boolean = true
    ) {
      val stackList = ArrayList<Bundle>()
      if (detailsUnversioned != null) {
        val details = RNObject.wrap(detailsUnversioned)
        val arguments = RNObject("com.facebook.react.bridge.Arguments")
        arguments.loadVersion(details.version())
        for (i in 0 until details.call("size") as Int) {
          try {
            val bundle = arguments.callStatic("toBundle", details.call("getMap", i)) as Bundle
            stackList.add(bundle)
          } catch (e: Exception) {
            e.printStackTrace()
          }
        }
      } else if (BuildConfig.DEBUG) {
        val stackTraceElements = Thread.currentThread().stackTrace
        // stackTraceElements starts with a bunch of stuff we don't care about.
        for (i in 2 until stackTraceElements.size) {
          val element = stackTraceElements[i]
          if ((
            (element.fileName != null) && element.fileName.startsWith(Kernel::class.java.simpleName) &&
              ((element.methodName == "handleReactNativeError") || (element.methodName == "handleError"))
            )
          ) {
            // Ignore these base error handling methods.
            continue
          }
          val bundle = Bundle().apply {
            putInt("column", 0)
            putInt("lineNumber", element.lineNumber)
            putString("methodName", element.methodName)
            putString("file", element.fileName)
          }
          stackList.add(bundle)
        }
      }
      val stack = stackList.toTypedArray()
      BaseExperienceActivity.addError(
        ExponentError(
          errorMessage,
          errorHeader,
          stack,
          getExceptionId(exceptionId),
          isFatal,
          canRetry
        )
      )
    }

    private fun getExceptionId(originalId: Int?): Int {
      return if (originalId == null || originalId == -1) {
        (-(Math.random() * Int.MAX_VALUE)).toInt()
      } else {
        originalId
      }
    }
  }

  init {
    NativeModuleDepsProvider.instance.inject(Kernel::class.java, this)
    instance = this
    updateKernelRNOkHttp()
  }
}
