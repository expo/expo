package expo.modules.updates

import android.content.Context
import android.net.Uri
import android.os.AsyncTask
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.JSBundleLoader
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.Reaper
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.launcher.DatabaseLauncher
import expo.modules.updates.launcher.Launcher
import expo.modules.updates.launcher.Launcher.LauncherCallback
import expo.modules.updates.launcher.NoDatabaseLauncher
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.loader.LoaderTask
import expo.modules.updates.loader.LoaderTask.BackgroundUpdateStatus
import expo.modules.updates.loader.LoaderTask.LoaderTaskCallback
import expo.modules.updates.manifest.UpdateManifest
import expo.modules.updates.selectionpolicy.SelectionPolicy
import expo.modules.updates.selectionpolicy.SelectionPolicyFactory
import java.io.File
import java.lang.ref.WeakReference

class UpdatesController private constructor(
  context: Context,
  var updatesConfiguration: UpdatesConfiguration
) {
  private var reactNativeHost: WeakReference<ReactNativeHost>? = if (context is ReactApplication) {
    WeakReference((context as ReactApplication).reactNativeHost)
  } else {
    null
  }

  var updatesDirectory: File? = null
  var updatesDirectoryException: Exception? = null

  private var launcher: Launcher? = null
  val databaseHolder = DatabaseHolder(UpdatesDatabase.getInstance(context))

  private var mSelectionPolicy: SelectionPolicy? = null
  private var defaultSelectionPolicy: SelectionPolicy = SelectionPolicyFactory.createFilterAwarePolicy(
    UpdatesUtils.getRuntimeVersion(updatesConfiguration)
  )
  val fileDownloader: FileDownloader = FileDownloader(context)

  // launch conditions
  private var isLoaderTaskFinished = false
  var isEmergencyLaunch = false
    private set

  /**
   * If UpdatesController.initialize() is not provided with a [ReactApplication], this method
   * can be used to set a [ReactNativeHost] on the class. This is optional, but required in
   * order for `Updates.reload()` and some Updates module events to work.
   * @param reactNativeHost the ReactNativeHost of the application running the Updates module
   */
  fun setReactNativeHost(reactNativeHost: ReactNativeHost) {
    this.reactNativeHost = WeakReference(reactNativeHost)
  }

  /**
   * Returns the path on disk to the launch asset (JS bundle) file for the React Native host to use.
   * Blocks until the configured timeout runs out, or a new update has been downloaded and is ready
   * to use (whichever comes sooner). ReactNativeHost.getJSBundleFile() should call into this.
   *
   * If this returns null, something has gone wrong and expo-updates has not been able to launch or
   * find an update to use. In (and only in) this case, `getBundleAssetName()` will return a nonnull
   * fallback value to use.
   */
  @get:Synchronized
  val launchAssetFile: String?
    get() {
      while (!isLoaderTaskFinished) {
        try {
          (this as java.lang.Object).wait()
        } catch (e: InterruptedException) {
          Log.e(TAG, "Interrupted while waiting for launch asset file", e)
        }
      }
      return launcher?.launchAssetFile
    }

  /**
   * Returns the filename of the launch asset (JS bundle) file embedded in the APK bundle, which can
   * be read using `context.getAssets()`. This is only nonnull if `getLaunchAssetFile` is null and
   * should only be used in such a situation. ReactNativeHost.getBundleAssetName() should call into
   * this.
   */
  val bundleAssetName: String?
    get() = launcher?.bundleAssetName

  /**
   * Returns a map of the locally downloaded assets for the current update. Keys are the remote URLs
   * of the assets and values are local paths. This should be exported by the Updates JS module and
   * can be used by `expo-asset` or a similar module to override React Native's asset resolution and
   * use the locally downloaded assets.
   */
  val localAssetFiles: Map<AssetEntity, String>?
    get() = launcher?.localAssetFiles

  val isUsingEmbeddedAssets: Boolean
    get() = launcher?.isUsingEmbeddedAssets ?: false

  val database: UpdatesDatabase
    get() = databaseHolder.database

  fun releaseDatabase() {
    databaseHolder.releaseDatabase()
  }

  val updateUrl: Uri?
    get() = updatesConfiguration.updateUrl

  val launchedUpdate: UpdateEntity?
    get() = launcher?.launchedUpdate

  val selectionPolicy: SelectionPolicy
    get() = mSelectionPolicy ?: defaultSelectionPolicy

  // Internal Setters

  /**
   * For external modules that want to modify the selection policy used at runtime.
   *
   * This method does not provide any guarantees about how long the provided selection policy will
   * persist; sometimes expo-updates will reset the selection policy in situations where it makes
   * sense to have explicit control (e.g. if the developer/user has programmatically fetched an
   * update, expo-updates will reset the selection policy so the new update is launched on th
   * next reload).
   * @param selectionPolicy The SelectionPolicy to use next, until overridden by expo-updates
   */
  fun setNextSelectionPolicy(selectionPolicy: SelectionPolicy?) {
    mSelectionPolicy = selectionPolicy
  }

  fun resetSelectionPolicyToDefault() {
    mSelectionPolicy = null
  }

  fun setDefaultSelectionPolicy(selectionPolicy: SelectionPolicy) {
    defaultSelectionPolicy = selectionPolicy
  }

  fun setLauncher(launcher: Launcher?) {
    this.launcher = launcher
  }

  /**
   * Starts the update process to launch a previously-loaded update and (if configured to do so)
   * check for a new update from the server. This method should be called as early as possible in
   * the application's lifecycle.
   * @param context the base context of the application, ideally a [ReactApplication]
   */
  @Synchronized
  fun start(context: Context) {
    if (!updatesConfiguration.isEnabled) {
      launcher = NoDatabaseLauncher(context, updatesConfiguration)
    }
    if (updatesConfiguration.updateUrl == null || updatesConfiguration.scopeKey == null) {
      throw AssertionError("expo-updates is enabled, but no valid URL is configured in AndroidManifest.xml. If you are making a release build for the first time, make sure you have run `expo publish` at least once.")
    }
    if (updatesDirectory == null) {
      launcher = NoDatabaseLauncher(context, updatesConfiguration, updatesDirectoryException)
      isEmergencyLaunch = true
    }

    LoaderTask(
      updatesConfiguration,
      databaseHolder,
      updatesDirectory,
      fileDownloader,
      selectionPolicy,
      object : LoaderTaskCallback {
        override fun onFailure(e: Exception) {
          launcher = NoDatabaseLauncher(context, updatesConfiguration, e)
          isEmergencyLaunch = true
          notifyController()
        }

        override fun onCachedUpdateLoaded(update: UpdateEntity): Boolean {
          return true
        }

        override fun onRemoteUpdateManifestLoaded(updateManifest: UpdateManifest) {}
        override fun onSuccess(launcher: Launcher, isUpToDate: Boolean) {
          this@UpdatesController.launcher = launcher
          notifyController()
        }

        override fun onBackgroundUpdateFinished(
          status: BackgroundUpdateStatus,
          update: UpdateEntity?,
          exception: Exception?
        ) {
          when (status) {
            BackgroundUpdateStatus.ERROR -> {
              if (exception == null) {
                throw AssertionError("Background update with error status must have a nonnull exception object")
              }
              val params = Arguments.createMap()
              params.putString("message", exception.message)
              UpdatesUtils.sendEventToReactNative(reactNativeHost, UPDATE_ERROR_EVENT, params)
            }
            BackgroundUpdateStatus.UPDATE_AVAILABLE -> {
              if (update == null) {
                throw AssertionError("Background update with error status must have a nonnull update object")
              }
              val params = Arguments.createMap()
              params.putString("manifestString", update.manifest.toString())
              UpdatesUtils.sendEventToReactNative(reactNativeHost, UPDATE_AVAILABLE_EVENT, params)
            }
            BackgroundUpdateStatus.NO_UPDATE_AVAILABLE -> {
              UpdatesUtils.sendEventToReactNative(
                reactNativeHost,
                UPDATE_NO_UPDATE_AVAILABLE_EVENT,
                null
              )
            }
          }
        }
      }
    ).start(context)
  }

  @Synchronized
  private fun notifyController() {
    isLoaderTaskFinished = true
    (this as java.lang.Object).notify()
  }

  fun runReaper() {
    AsyncTask.execute {
      val databaseLocal = database
      Reaper.reapUnusedUpdates(
        updatesConfiguration,
        databaseLocal,
        updatesDirectory,
        launchedUpdate,
        selectionPolicy
      )
      releaseDatabase()
    }
  }

  fun relaunchReactApplication(context: Context, callback: LauncherCallback) {
    val host = reactNativeHost?.get()
    if (host == null) {
      callback.onFailure(Exception("Could not reload application. Ensure you have passed the correct instance of ReactApplication into UpdatesController.initialize()."))
      return
    }

    val oldLaunchAssetFile = launcher!!.launchAssetFile

    val databaseLocal = database
    val newLauncher = DatabaseLauncher(
      updatesConfiguration,
      updatesDirectory!!,
      fileDownloader,
      selectionPolicy
    )
    newLauncher.launch(
      databaseLocal, context,
      object : LauncherCallback {
        override fun onFailure(e: Exception) {
          callback.onFailure(e)
        }

        override fun onSuccess() {
          launcher = newLauncher
          releaseDatabase()

          val instanceManager = host.reactInstanceManager

          val newLaunchAssetFile = launcher!!.launchAssetFile
          if (newLaunchAssetFile != null && newLaunchAssetFile != oldLaunchAssetFile) {
            // Unfortunately, even though RN exposes a way to reload an application,
            // it assumes that the JS bundle will stay at the same location throughout
            // the entire lifecycle of the app. Since we need to change the location of
            // the bundle, we need to use reflection to set an otherwise inaccessible
            // field of the ReactInstanceManager.
            try {
              val newJSBundleLoader = JSBundleLoader.createFileLoader(newLaunchAssetFile)
              val jsBundleLoaderField = instanceManager.javaClass.getDeclaredField("mBundleLoader")
              jsBundleLoaderField.isAccessible = true
              jsBundleLoaderField[instanceManager] = newJSBundleLoader
            } catch (e: Exception) {
              Log.e(TAG, "Could not reset JSBundleLoader in ReactInstanceManager", e)
            }
          }
          callback.onSuccess()
          val handler = Handler(Looper.getMainLooper())
          handler.post { instanceManager.recreateReactContextInBackground() }
          runReaper()
        }
      }
    )
  }

  companion object {
    private val TAG = UpdatesController::class.java.simpleName

    private const val UPDATE_AVAILABLE_EVENT = "updateAvailable"
    private const val UPDATE_NO_UPDATE_AVAILABLE_EVENT = "noUpdateAvailable"
    private const val UPDATE_ERROR_EVENT = "error"

    private var singletonInstance: UpdatesController? = null
    @JvmStatic val instance: UpdatesController
      get() {
        return checkNotNull(singletonInstance) { "UpdatesController.instance was called before the module was initialized" }
      }

    @JvmStatic fun initializeWithoutStarting(context: Context) {
      if (singletonInstance == null) {
        val updatesConfiguration = UpdatesConfiguration().loadValuesFromMetadata(context)
        singletonInstance = UpdatesController(context, updatesConfiguration)
      }
    }

    /**
     * Initializes the UpdatesController singleton. This should be called as early as possible in the
     * application's lifecycle.
     * @param context the base context of the application, ideally a [ReactApplication]
     */
    @JvmStatic fun initialize(context: Context) {
      initializeWithoutStarting(context)
      singletonInstance!!.start(context)
    }

    /**
     * Initializes the UpdatesController singleton. This should be called as early as possible in the
     * application's lifecycle. Use this method to set or override configuration values at runtime
     * rather than from AndroidManifest.xml.
     * @param context the base context of the application, ideally a [ReactApplication]
     */
    @JvmStatic fun initialize(context: Context, configuration: Map<String, Any>) {
      if (singletonInstance == null) {
        val updatesConfiguration = UpdatesConfiguration()
          .loadValuesFromMetadata(context)
          .loadValuesFromMap(configuration)
        singletonInstance = UpdatesController(context, updatesConfiguration)
        singletonInstance!!.start(context)
      }
    }
  }

  init {
    try {
      updatesDirectory = UpdatesUtils.getOrCreateUpdatesDirectory(context)
    } catch (e: Exception) {
      updatesDirectoryException = e
      updatesDirectory = null
    }
  }
}
