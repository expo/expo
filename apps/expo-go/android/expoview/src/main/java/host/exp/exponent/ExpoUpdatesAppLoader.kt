// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent

import android.content.Context
import android.util.Log
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.launcher.Launcher
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.loader.LoaderTask
import expo.modules.updates.loader.LoaderTask.LoaderTaskCallback
import expo.modules.updates.loader.LoaderTask.RemoteUpdateStatus
import expo.modules.updates.manifest.Update
import expo.modules.manifests.core.Manifest
import expo.modules.updates.codesigning.CODE_SIGNING_METADATA_ALGORITHM_KEY
import expo.modules.updates.codesigning.CODE_SIGNING_METADATA_KEY_ID_KEY
import expo.modules.updates.codesigning.CodeSigningAlgorithm
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.selectionpolicy.LoaderSelectionPolicyFilterAware
import expo.modules.updates.selectionpolicy.ReaperSelectionPolicyDevelopmentClient
import expo.modules.updates.selectionpolicy.SelectionPolicy
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.exceptions.ManifestException
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.ExpoViewKernel
import host.exp.exponent.kernel.Kernel
import host.exp.exponent.kernel.KernelConfig
import host.exp.exponent.storage.ExponentSharedPreferences
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.io.File
import java.util.*
import javax.inject.Inject
import kotlin.time.DurationUnit
import kotlin.time.toDuration

private const val UPDATE_AVAILABLE_EVENT = "updateAvailable"
private const val UPDATE_NO_UPDATE_AVAILABLE_EVENT = "noUpdateAvailable"
private const val UPDATE_ERROR_EVENT = "error"

/**
 * Entry point to expo-updates in Expo Go. Fulfills many of the
 * purposes of [UpdatesController] along with serving as an interface to the rest of the kernel.
 *
 * Dynamically generates a configuration object with the correct scope key, and then, like
 * [UpdatesController], delegates to an instance of [LoaderTask] to start the process of loading and
 * launching an update, and responds appropriately depending on the callbacks that are invoked.
 *
 * Multiple instances of ExpoUpdatesAppLoader can exist at a time; instances are retained by
 * [Kernel].
 */
class ExpoUpdatesAppLoader @JvmOverloads constructor(
  private val manifestUrl: String,
  private val callback: AppLoaderCallback,
  private val useCacheOnly: Boolean = false
) {
  @Inject
  lateinit var exponentSharedPreferences: ExponentSharedPreferences

  @Inject
  lateinit var databaseHolder: DatabaseHolder

  @Inject
  lateinit var kernel: Kernel

  enum class AppLoaderStatus {
    CHECKING_FOR_UPDATE,
    DOWNLOADING_NEW_UPDATE
  }

  var isUpToDate = true
    private set
  var status: AppLoaderStatus? = null
    private set(value) {
      field = value
      callback.updateStatus(value)
    }

  var shouldShowAppLoaderStatus = true
    private set
  private var isStarted = false
  private var startupStartTimeMillis: Long? = null
  private var startupEndTimeMillis: Long? = null
  val launchDuration
    get() = startupStartTimeMillis?.let { start ->
      startupEndTimeMillis?.let { end ->
        (end - start).toDuration(
          DurationUnit.MILLISECONDS
        )
      }
    }

  interface AppLoaderCallback {
    fun onOptimisticManifest(optimisticManifest: Manifest)
    fun onManifestCompleted(manifest: Manifest)
    fun onBundleCompleted(localBundlePath: String)
    fun emitEvent(params: JSONObject)
    fun updateStatus(status: AppLoaderStatus?)
    fun onError(e: Exception)
  }

  lateinit var updatesConfiguration: UpdatesConfiguration
    private set

  lateinit var launcher: Launcher
    private set

  fun start(context: Context) {
    check(!isStarted) { "AppLoader for $manifestUrl was started twice. AppLoader.start() may only be called once per instance." }
    isStarted = true
    startupStartTimeMillis = System.currentTimeMillis()
    status = AppLoaderStatus.CHECKING_FOR_UPDATE
    kernel.addAppLoaderForManifestUrl(manifestUrl, this)

    val httpManifestUrl = ExponentManifest.httpManifestUrl(manifestUrl)

    val configMap = mutableMapOf<String, Any>().apply {
      this[UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY] = httpManifestUrl
      this[UpdatesConfiguration.UPDATES_CONFIGURATION_SCOPE_KEY_KEY] = httpManifestUrl.toString()
      this[UpdatesConfiguration.UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE_KEY] = false
      this[UpdatesConfiguration.UPDATES_CONFIGURATION_ENABLED_KEY] = true
      if (useCacheOnly) {
        this[UpdatesConfiguration.UPDATES_CONFIGURATION_CHECK_ON_LAUNCH_KEY] = "NEVER"
        this[UpdatesConfiguration.UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_KEY] = 0
      } else {
        this[UpdatesConfiguration.UPDATES_CONFIGURATION_CHECK_ON_LAUNCH_KEY] = "ALWAYS"
        this[UpdatesConfiguration.UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_KEY] = 60000
      }
      this[UpdatesConfiguration.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY] = requestHeaders
      this[UpdatesConfiguration.UPDATES_CONFIGURATION_RUNTIME_VERSION_KEY] = "exposdk:${Constants.SDK_VERSION}"
      // in Expo Go, embed the Expo Root Certificate and get the Expo Go intermediate certificate and development certificates from the multipart manifest response part
      this[UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE] = context.assets.open("expo-root.pem").readBytes().decodeToString()
      this[UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_METADATA] = mapOf(
        CODE_SIGNING_METADATA_KEY_ID_KEY to "expo-root",
        CODE_SIGNING_METADATA_ALGORITHM_KEY to CodeSigningAlgorithm.RSA_SHA256.algorithmName
      )
      this[UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_INCLUDE_MANIFEST_RESPONSE_CERTIFICATE_CHAIN] = true
      this[UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_ALLOW_UNSIGNED_MANIFESTS] = true
      // in Expo Go, ignore directives in manifest responses and require a manifest. the current directives (no update available, roll back) don't have any practical use outside of apps that use the library directly.
      this[UpdatesConfiguration.UPDATES_CONFIGURATION_ENABLE_EXPO_UPDATES_PROTOCOL_V0_COMPATIBILITY_MODE] = true
    }.toMap()

    val configuration = UpdatesConfiguration(null, configMap)
    val sdkVersionsList = listOf(Constants.SDK_VERSION, RNObject.UNVERSIONED).flatMap {
      listOf(it, "exposdk:$it")
    }
    val selectionPolicy = SelectionPolicy(
      ExpoGoLauncherSelectionPolicyFilterAware(sdkVersionsList),
      LoaderSelectionPolicyFilterAware(),
      ReaperSelectionPolicyDevelopmentClient()
    )
    val directory: File = try {
      UpdatesUtils.getOrCreateUpdatesDirectory(context)
    } catch (e: Exception) {
      callback.onError(e)
      return
    }
    val logger = UpdatesLogger(context)
    val fileDownloader = FileDownloader(context, configuration, logger)
    startLoaderTask(configuration, fileDownloader, directory, selectionPolicy, context, logger)
  }

  private fun startLoaderTask(
    configuration: UpdatesConfiguration,
    fileDownloader: FileDownloader,
    directory: File,
    selectionPolicy: SelectionPolicy,
    context: Context,
    logger: UpdatesLogger
  ) {
    updatesConfiguration = configuration
    LoaderTask(
      context,
      configuration,
      databaseHolder,
      directory,
      fileDownloader,
      selectionPolicy,
      logger,
      object : LoaderTaskCallback {
        private var didAbort = false
        override fun onFailure(e: Exception) {
          if (didAbort) {
            return
          }
          this@ExpoUpdatesAppLoader.startupEndTimeMillis = System.currentTimeMillis()
          var exception = e
          try {
            val errorJson = JSONObject(e.message!!)
            exception = ManifestException(e, manifestUrl, errorJson)
          } catch (ex: Exception) {
            // do nothing, expected if the error payload does not come from a conformant server
          }
          callback.onError(exception)
        }

        override fun onFinishedAllLoading() {}

        override fun onCachedUpdateLoaded(update: UpdateEntity): Boolean {
          val manifest = Manifest.fromManifestJson(update.manifest)
          setShouldShowAppLoaderStatus(manifest)
          if (manifest.isUsingDeveloperTool()) {
            return false
          } else {
            try {
              val experienceKey = ExperienceKey.fromManifest(manifest)
              // if previous run of this app failed due to a loading error, we want to make sure to check for remote updates
              val experienceMetadata = exponentSharedPreferences.getExperienceMetadata(experienceKey)
              if (experienceMetadata != null && experienceMetadata.optBoolean(
                  ExponentSharedPreferences.EXPERIENCE_METADATA_LOADING_ERROR
                )
              ) {
                return false
              }
            } catch (e: Exception) {
              return true
            }
          }
          return true
        }

        override fun onRemoteUpdateManifestResponseUpdateLoaded(update: Update) {
          // expo-cli does not always respect our SDK version headers and respond with a compatible update or an error
          // so we need to check the compatibility here
          val sdkVersion = update.manifest.getExpoGoSDKVersion()
          if (!isValidSdkVersion(sdkVersion)) {
            callback.onError(formatExceptionForIncompatibleSdk(sdkVersion))
            didAbort = true
            return
          }
          setShouldShowAppLoaderStatus(update.manifest)
          callback.onOptimisticManifest(update.manifest)
          status = AppLoaderStatus.DOWNLOADING_NEW_UPDATE
        }

        override fun onSuccess(launcher: Launcher, isUpToDate: Boolean) {
          if (didAbort) {
            return
          }
          this@ExpoUpdatesAppLoader.startupEndTimeMillis = System.currentTimeMillis()
          this@ExpoUpdatesAppLoader.launcher = launcher
          this@ExpoUpdatesAppLoader.isUpToDate = isUpToDate
          try {
            val manifestJson = processManifestJson(launcher.launchedUpdate!!.manifest)
            val manifest = Manifest.fromManifestJson(manifestJson)
            callback.onManifestCompleted(manifest)

            // ReactAndroid will load the bundle on its own in development mode
            if (!manifest.isDevelopmentMode()) {
              callback.onBundleCompleted(launcher.launchAssetFile!!)
            }
          } catch (e: Exception) {
            callback.onError(e)
          }
        }

        override fun onRemoteUpdateFinished(
          status: RemoteUpdateStatus,
          update: UpdateEntity?,
          exception: Exception?
        ) {
          if (didAbort) {
            return
          }
          try {
            val jsonParams = JSONObject()
            when (status) {
              RemoteUpdateStatus.ERROR -> {
                if (exception == null) {
                  throw AssertionError("Background update with error status must have a nonnull exception object")
                }
                jsonParams.put("type", UPDATE_ERROR_EVENT)
                jsonParams.put("message", exception.message)
              }
              RemoteUpdateStatus.UPDATE_AVAILABLE -> {
                if (update == null) {
                  throw AssertionError("Background update with error status must have a nonnull update object")
                }
                jsonParams.put("type", UPDATE_AVAILABLE_EVENT)
                jsonParams.put("manifestString", update.manifest.toString())
              }
              RemoteUpdateStatus.NO_UPDATE_AVAILABLE -> {
                jsonParams.put("type", UPDATE_NO_UPDATE_AVAILABLE_EVENT)
              }
            }
            callback.emitEvent(jsonParams)
          } catch (e: Exception) {
            Log.e(TAG, "Failed to emit event to JS", e)
          }
        }
      }
    ).start()
  }

  private fun setShouldShowAppLoaderStatus(manifest: Manifest) {
    // we don't want to show the cached experience alert when Updates.reloadAsync() is called
    if (useCacheOnly) {
      shouldShowAppLoaderStatus = false
      return
    }
    shouldShowAppLoaderStatus = !manifest.isDevelopmentSilentLaunch()
  }

  // XDL expects the full "exponent-" header names
  private val requestHeaders: Map<String, String?>
    get() {
      val headers = mutableMapOf<String, String>()
      headers["Expo-Updates-Environment"] = clientEnvironment
      headers["Expo-Client-Environment"] = clientEnvironment
      val versionName = ExpoViewKernel.instance.versionName
      if (versionName != null) {
        headers["Exponent-Version"] = versionName
      }
      val sessionSecret = exponentSharedPreferences.sessionSecret
      if (sessionSecret != null) {
        headers["Expo-Session"] = sessionSecret
      }

      // XDL expects the full "exponent-" header names
      headers["Exponent-Accept-Signature"] = "true"
      headers["Exponent-Platform"] = "android"
      if (KernelConfig.FORCE_UNVERSIONED_PUBLISHED_EXPERIENCES) {
        headers["Exponent-SDK-Version"] = "UNVERSIONED"
      } else {
        headers["Exponent-SDK-Version"] = Constants.SDK_VERSION
      }
      return headers
    }

  private val clientEnvironment: String
    get() = if (EmulatorUtilities.isRunningOnEmulator()) {
      "EXPO_SIMULATOR"
    } else {
      "EXPO_DEVICE"
    }

  private fun isValidSdkVersion(sdkVersion: String?): Boolean {
    if (sdkVersion == null) {
      return false
    }
    if (RNObject.UNVERSIONED == sdkVersion) {
      return true
    }
    if (Constants.SDK_VERSION == sdkVersion) {
      return true
    }
    return false
  }

  private fun formatExceptionForIncompatibleSdk(sdkVersion: String?): ManifestException {
    val errorJson = JSONObject()
    try {
      errorJson.put("message", "Invalid SDK version")
      if (sdkVersion == null) {
        errorJson.put("errorCode", "NO_SDK_VERSION_SPECIFIED")
      } else if (ABIVersion.toNumber(sdkVersion) > ABIVersion.toNumber(Constants.SDK_VERSION)) {
        errorJson.put("errorCode", "EXPERIENCE_SDK_VERSION_TOO_NEW")
      } else {
        errorJson.put("errorCode", "EXPERIENCE_SDK_VERSION_OUTDATED")
        errorJson.put(
          "metadata",
          JSONObject().put(
            "availableSDKVersions",
            JSONArray().put(sdkVersion)
          )
        )
      }
    } catch (e: Exception) {
      Log.e(TAG, "Failed to format error message for incompatible SDK version", e)
    }
    return ManifestException(Exception("Incompatible SDK version"), manifestUrl, errorJson)
  }

  companion object {
    private val TAG = ExpoUpdatesAppLoader::class.java.simpleName
    const val UPDATES_EVENT_NAME = "Expo.nativeUpdatesEvent"

    @Throws(JSONException::class)
    private fun processManifestJson(manifestJson: JSONObject): JSONObject {
      // if the manifest is scoped to a random anonymous scope key, automatically verify it
      if (ExponentManifest.isAnonymousExperience(Manifest.fromManifestJson(manifestJson))) {
        manifestJson.put(ExponentManifest.MANIFEST_IS_VERIFIED_KEY, true)
      }

      // otherwise set verified to false
      if (!manifestJson.has(ExponentManifest.MANIFEST_IS_VERIFIED_KEY)) {
        manifestJson.put(ExponentManifest.MANIFEST_IS_VERIFIED_KEY, false)
      }

      return manifestJson
    }
  }

  init {
    NativeModuleDepsProvider.instance.inject(ExpoUpdatesAppLoader::class.java, this)
  }
}
