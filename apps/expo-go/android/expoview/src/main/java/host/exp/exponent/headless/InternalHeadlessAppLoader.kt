package host.exp.exponent.headless

import android.app.Application
import android.content.Context
import android.net.Uri
import android.util.SparseArray
import com.facebook.react.ReactHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.DevInternalSettings
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import expo.modules.ReactNativeHostWrapper
import expo.modules.apploader.AppLoaderProvider
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.SingletonModule
import expo.modules.manifests.core.Manifest
import host.exp.exponent.Constants
import host.exp.exponent.ExpoUpdatesAppLoader
import host.exp.exponent.ExpoUpdatesAppLoader.AppLoaderCallback
import host.exp.exponent.ExpoUpdatesAppLoader.AppLoaderStatus
import host.exp.exponent.ExponentManifest
import host.exp.exponent.RNObject
import host.exp.exponent.experience.ExpoGoReactNativeHost
import host.exp.exponent.factories.ReactHostFactory
import host.exp.exponent.kernel.ExponentUrls
import host.exp.exponent.kernel.KernelConstants
import host.exp.exponent.storage.ExponentDB
import host.exp.exponent.storage.ExponentDBObject
import host.exp.exponent.taskManager.AppLoaderInterface
import host.exp.exponent.taskManager.AppRecordInterface
import host.exp.exponent.utils.AsyncCondition
import host.exp.exponent.utils.AsyncCondition.AsyncConditionListener
import host.exp.exponent.utils.ExpoActivityIds
import host.exp.expoview.Exponent
import host.exp.expoview.Exponent.InstanceManagerBuilderProperties
import host.exp.expoview.Exponent.StartReactInstanceDelegate
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import versioned.host.exp.exponent.ExponentPackage
import versioned.host.exp.exponent.ExponentPackageDelegate
import versioned.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter
import javax.inject.Inject

// @tsapeta: Most parts of this class was just copied from ReactNativeActivity and ExperienceActivity,
// however it allows launching apps in the background, without the activity.
// I've found it pretty hard to make just one implementation that can be used in both cases,
// so I decided to go with a copy until we refactor these activity classes.

class InternalHeadlessAppLoader(private val context: Context) :
  AppLoaderInterface,
  StartReactInstanceDelegate,
  ExponentPackageDelegate {

  private var manifest: Manifest? = null
  private var manifestUrl: String? = null
  private var sdkVersion: String? = null
  private var detachSdkVersion: String? = null
  private var reactHost: ReactHost? = null
  private val intentUri: String? = null
  private var isReadyForBundle = false
  private var jsBundlePath: String? = null
  private var appRecord: HeadlessAppRecord? = null
  private var callback: AppLoaderProvider.Callback? = null
  private var activityId = 0

  @Inject
  lateinit var exponentManifest: ExponentManifest

  override fun loadApp(
    appUrl: String,
    options: Map<String, Any>,
    callback: AppLoaderProvider.Callback
  ): AppRecordInterface {
    manifestUrl = appUrl
    appRecord = HeadlessAppRecord()
    this.callback = callback
    activityId = ExpoActivityIds.getNextHeadlessActivityId()

    ExpoUpdatesAppLoader(
      manifestUrl!!,
      object : AppLoaderCallback {
        override fun onOptimisticManifest(optimisticManifest: Manifest) {}
        override fun onManifestCompleted(manifest: Manifest) {
          Exponent.instance.runOnUiThread {
            try {
              val bundleUrl = ExponentUrls.toHttp(manifest.getBundleURL())
              activityIdToBundleUrl.put(activityId, bundleUrl)
              setManifest(manifestUrl!!, manifest, bundleUrl)
            } catch (e: JSONException) {
              this@InternalHeadlessAppLoader.callback!!.onComplete(false, Exception(e.message))
            }
          }
        }

        override fun onBundleCompleted(localBundlePath: String) {
          Exponent.instance.runOnUiThread { setBundle(localBundlePath) }
        }

        override fun emitEvent(params: JSONObject) {}
        override fun updateStatus(status: AppLoaderStatus?) {}
        override fun onError(e: Exception) {
          Exponent.instance.runOnUiThread { this@InternalHeadlessAppLoader.callback!!.onComplete(false, Exception(e.message)) }
        }
      },
      true
    ).start(context)

    return appRecord!!
  }

  private fun setManifest(manifestUrl: String, manifest: Manifest, bundleUrl: String?) {
    this.manifestUrl = manifestUrl
    this.manifest = manifest
    sdkVersion = manifest.getExpoGoSDKVersion()

    // Notifications logic uses this to determine which experience to route a notification to
    ExponentDB.saveExperience(ExponentDBObject(this.manifestUrl!!, manifest, bundleUrl!!))

    // Sometime we want to release a new version without adding a new .aar. Use TEMPORARY_SDK_VERSION
    // to point to the unversioned code in ReactAndroid.
    if (Constants.SDK_VERSION == sdkVersion) {
      sdkVersion = RNObject.UNVERSIONED
    }

    detachSdkVersion = sdkVersion

    if (RNObject.UNVERSIONED != sdkVersion) {
      val isValidVersion = sdkVersion == Constants.SDK_VERSION
      if (!isValidVersion) {
        callback!!.onComplete(false, Exception("$sdkVersion is not a valid SDK version."))
        return
      }
    }

    soLoaderInit()

    UiThreadUtil.runOnUiThread {
      reactHost?.onHostDestroy()
      if (isDebugModeEnabled) {
        jsBundlePath = ""
        startReactInstance()
      } else {
        isReadyForBundle = true
        AsyncCondition.notify(READY_FOR_BUNDLE)
      }
    }
  }

  private fun setBundle(localBundlePath: String) {
    if (!isDebugModeEnabled) {
      AsyncCondition.wait(
        READY_FOR_BUNDLE,
        object : AsyncConditionListener {
          override fun isReady(): Boolean {
            return isReadyForBundle
          }

          override fun execute() {
            jsBundlePath = localBundlePath
            startReactInstance()
            AsyncCondition.remove(READY_FOR_BUNDLE)
          }
        }
      )
    }
  }

  override val isDebugModeEnabled: Boolean
    get() = manifest?.isDevelopmentMode() ?: false

  private fun soLoaderInit() {
    if (detachSdkVersion != null) {
      SoLoader.init(context, OpenSourceMergedSoMapping)
    }
  }

  // Override
  private fun reactPackages(): List<ReactPackage?>? {
    // Pass null if it's on Expo Go. In that case packages from ExperiencePackagePicker will be used instead.
    return null
  }

  // Override
  fun expoPackages(): List<Package>? {
    // Pass null if it's on Expo Go. In that case packages from ExperiencePackagePicker will be used instead.
    return null
  }

  //region StartReactInstanceDelegate
  override val isInForeground: Boolean = false
  override val exponentPackageDelegate: ExponentPackageDelegate = this

  override fun handleUnreadNotifications(unreadNotifications: JSONArray) {}

  //endregion
  private fun startReactInstance() {
    Exponent.instance.testPackagerStatus(
      isDebugModeEnabled,
      manifest!!,
      object : Exponent.PackagerStatusCallback {
        override fun onSuccess() {
          reactHost = startReactInstance(
            this@InternalHeadlessAppLoader,
            intentUri,
            expoPackages()
          )
        }

        override fun onFailure(errorMessage: String) {
          callback!!.onComplete(false, Exception(errorMessage))
        }
      }
    )
  }

  private fun startReactInstance(
    delegate: StartReactInstanceDelegate,
    mIntentUri: String?,
    extraExpoPackages: List<Package>?
  ): ReactHost {
    val experienceProperties = mapOf(
      KernelConstants.MANIFEST_URL_KEY to manifestUrl,
      KernelConstants.LINKING_URI_KEY to linkingUri,
      KernelConstants.INTENT_URI_KEY to mIntentUri
    )
    val instanceManagerBuilderProperties = InstanceManagerBuilderProperties(
      application = context as Application,
      jsBundlePath = jsBundlePath,
      experienceProperties = experienceProperties,
      expoPackages = extraExpoPackages,
      exponentPackageDelegate = delegate.exponentPackageDelegate,
      manifest = manifest!!,
      singletonModules = ExponentPackage.getOrCreateSingletonModules(context, manifest, extraExpoPackages)
    )

    val host = ExpoGoReactNativeHost(
      context,
      instanceManagerBuilderProperties
    )

    if (delegate.isDebugModeEnabled) {
      val debuggerHost = manifest!!.getDebuggerHost()
      val mainModuleName = manifest!!.getMainModuleName()
      Exponent.enableDeveloperSupport(debuggerHost, mainModuleName, host)
    }

    val wrapper = ReactNativeHostWrapper(context, host)
    val reactHost = ReactHostFactory.createFromReactNativeHost(context, wrapper)

    val devSupportManager = reactHost.devSupportManager
    if (devSupportManager != null) {
      val devSettings = devSupportManager.devSettings as DevInternalSettings
      devSettings.setExponentActivityId(activityId)
    }

    // keep a reference in app record, so it can be invalidated through AppRecord.invalidate()
    appRecord!!.setReactHost(reactHost)
    callback!!.onComplete(true, null)

    return reactHost
  }

  // deprecated in favor of Expo.Linking.makeUrl
  // TODO: remove this
  private val linkingUri: String?
    get() {
      val uri = Uri.parse(manifestUrl)
      val host = uri.host
      return if (host != null && (
          host == "exp.host" || host == "expo.io" || host == "exp.direct" || host == "expo.test" ||
            host.endsWith(".exp.host") || host.endsWith(".expo.io") || host.endsWith(".exp.direct") || host.endsWith(
              ".expo.test"
            )
          )
      ) {
        val pathSegments = uri.pathSegments
        val builder = uri.buildUpon()
        builder.path(null)
        for (segment in pathSegments) {
          if (ExponentManifest.DEEP_LINK_SEPARATOR == segment) {
            break
          }
          builder.appendEncodedPath(segment)
        }
        builder.appendEncodedPath(ExponentManifest.DEEP_LINK_SEPARATOR_WITH_SLASH).build()
          .toString()
      } else {
        manifestUrl
      }
    }

  override fun getScopedModuleRegistryAdapterForPackages(
    packages: List<Package>,
    singletonModules: List<SingletonModule>
  ): ExpoModuleRegistryAdapter? {
    return null
  }

  companion object {
    private const val READY_FOR_BUNDLE = "headlessAppReadyForBundle"

    private val activityIdToBundleUrl = SparseArray<String>()

    fun hasBundleUrlForActivityId(activityId: Int): Boolean {
      return activityId < -1 && activityIdToBundleUrl[activityId] != null
    }

    fun getBundleUrlForActivityId(activityId: Int): String? {
      return activityIdToBundleUrl[activityId]
    }
  }
}
