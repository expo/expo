package expo.modules.updates

import android.content.Context
import android.net.Uri
import android.os.AsyncTask
import android.os.Handler
import android.os.HandlerThread
import android.os.Looper
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import expo.modules.manifests.core.Manifest
import expo.modules.updates.db.BuildData
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.Reaper
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.errorrecovery.ErrorRecovery
import expo.modules.updates.errorrecovery.ErrorRecoveryDelegate
import expo.modules.updates.launcher.DatabaseLauncher
import expo.modules.updates.launcher.Launcher
import expo.modules.updates.launcher.Launcher.LauncherCallback
import expo.modules.updates.launcher.NoDatabaseLauncher
import expo.modules.updates.loader.*
import expo.modules.updates.loader.LoaderTask.BackgroundUpdateStatus
import expo.modules.updates.loader.LoaderTask.LoaderTaskCallback
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogReader
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.UpdateManifest
import expo.modules.updates.selectionpolicy.SelectionPolicy
import expo.modules.updates.selectionpolicy.SelectionPolicyFactory
import expo.modules.updates.statemachine.UpdatesStateChangeEventSender
import expo.modules.updates.statemachine.UpdatesStateEvent
import expo.modules.updates.statemachine.UpdatesStateEventType
import expo.modules.updates.statemachine.UpdatesStateMachine
import expo.modules.updates.statemachine.UpdatesStateValue
import java.io.File
import java.lang.ref.WeakReference

/**
 * Main entry point to expo-updates in normal release builds (development clients, including Expo
 * Go, use a different entry point). Singleton that keeps track of updates state, holds references
 * to instances of other updates classes, and is the central hub for all updates-related tasks.
 *
 * The `start` method in this class should be invoked early in the application lifecycle, via
 * [UpdatesPackage]. It delegates to an instance of [LoaderTask] to start the process of loading and
 * launching an update, then responds appropriately depending on the callbacks that are invoked.
 *
 * This class also provides getter methods to access information about the updates state, which are
 * used by the exported [UpdatesModule] through [UpdatesService]. Such information includes
 * references to: the database, the [UpdatesConfiguration] object, the path on disk to the updates
 * directory, any currently active [LoaderTask], the current [SelectionPolicy], the error recovery
 * handler, and the current launched update. This class is intended to be the source of truth for
 * these objects, so other classes shouldn't retain any of them indefinitely.
 *
 * This class also optionally holds a reference to the app's [ReactNativeHost], which allows
 * expo-updates to reload JS and send events through the bridge.
 */
class UpdatesController private constructor(
  context: Context,
  var updatesConfiguration: UpdatesConfiguration
) : UpdatesStateChangeEventSender {
  private var reactNativeHost: WeakReference<ReactNativeHost>? = if (context is ReactApplication) {
    WeakReference((context as ReactApplication).reactNativeHost)
  } else {
    null
  }

  var updatesDirectory: File? = null
  var updatesDirectoryException: Exception? = null
  var stateMachine: UpdatesStateMachine = UpdatesStateMachine(context)

  private var launcher: Launcher? = null
  val databaseHolder = DatabaseHolder(UpdatesDatabase.getInstance(context))

  // TODO: move away from DatabaseHolder pattern to Handler thread
  private val databaseHandlerThread = HandlerThread("expo-updates-database")
  private lateinit var databaseHandler: Handler
  private fun initializeDatabaseHandler() {
    if (!::databaseHandler.isInitialized) {
      databaseHandlerThread.start()
      databaseHandler = Handler(databaseHandlerThread.looper)
    }
  }

  private fun purgeUpdatesLogsOlderThanOneDay(context: Context) {
    UpdatesLogReader(context).purgeLogEntries {
      if (it != null) {
        Log.e(TAG, "UpdatesLogReader: error in purgeLogEntries", it)
      }
    }
  }

  private val logger = UpdatesLogger(context)
  private var isStarted = false
  private var loaderTask: LoaderTask? = null
  private var remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.IDLE

  private var mSelectionPolicy: SelectionPolicy? = null
  private var defaultSelectionPolicy: SelectionPolicy = SelectionPolicyFactory.createFilterAwarePolicy(
    UpdatesUtils.getRuntimeVersion(updatesConfiguration)
  )
  val fileDownloader: FileDownloader = FileDownloader(context)
  private val errorRecovery: ErrorRecovery = ErrorRecovery(context)

  private fun setRemoteLoadStatus(status: ErrorRecoveryDelegate.RemoteLoadStatus) {
    remoteLoadStatus = status
    errorRecovery.notifyNewRemoteLoadStatus(status)
  }

  // launch conditions
  private var isLoaderTaskFinished = false
  var isEmergencyLaunch = false
    private set

  private var jsEventQueue: MutableList<Map<String, Any>> = mutableListOf()

  fun onDidCreateReactInstanceManager(reactInstanceManager: ReactInstanceManager) {
    if (isEmergencyLaunch || !updatesConfiguration.isEnabled) {
      return
    }
    errorRecovery.startMonitoring(reactInstanceManager)
  }

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

  /**
   * Any process that calls this *must* manually release the lock by calling `releaseDatabase()` in
   * every possible case (success, error) as soon as it is finished.
   */
  fun getDatabase(): UpdatesDatabase = databaseHolder.database

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
    if (isStarted) {
      return
    }
    isStarted = true

    stateMachine.changeEventSender = this

    if (!updatesConfiguration.isEnabled) {
      launcher = NoDatabaseLauncher(context, updatesConfiguration)
      notifyController()
      return
    }
    if (updatesConfiguration.updateUrl == null || updatesConfiguration.scopeKey == null) {
      throw AssertionError("expo-updates is enabled, but no valid URL is configured in AndroidManifest.xml. If you are making a release build for the first time, make sure you have run `expo publish` at least once.")
    }
    if (updatesDirectory == null) {
      launcher = NoDatabaseLauncher(context, updatesConfiguration, updatesDirectoryException)
      isEmergencyLaunch = true
      notifyController()
      return
    }

    purgeUpdatesLogsOlderThanOneDay(context)

    initializeDatabaseHandler()
    initializeErrorRecovery(context)

    val databaseLocal = getDatabase()
    BuildData.ensureBuildDataIsConsistent(updatesConfiguration, databaseLocal)
    releaseDatabase()

    loaderTask = LoaderTask(
      updatesConfiguration,
      databaseHolder,
      updatesDirectory,
      fileDownloader,
      selectionPolicy,
      object : LoaderTaskCallback {
        override fun onFailure(e: Exception) {
          logger.error("UpdatesController loaderTask onFailure: ${e.localizedMessage}", UpdatesErrorCode.None)
          launcher = NoDatabaseLauncher(context, updatesConfiguration, e)
          isEmergencyLaunch = true
          notifyController()
        }

        override fun onCachedUpdateLoaded(update: UpdateEntity): Boolean {
          return true
        }

        override fun onCheckForUpdateStarted() {
          stateMachine.processEvent(UpdatesStateEvent(UpdatesStateEventType.Check))
        }

        override fun onCheckForUpdateFinished(body: Map<String, Any>) {
          var event = UpdatesStateEvent(UpdatesStateEventType.CheckCompleteUnavailable, mapOf())
          val manifest: Manifest? = body["manifest"] as? Manifest
          val rollback: Boolean? = body["isRollBackToEmbedded"] as? Boolean
          if (manifest != null) {
            event = UpdatesStateEvent(
              UpdatesStateEventType.CheckCompleteAvailable,
              mapOf(
                "manifest" to manifest.getRawJson()
              )
            )
          } else if (rollback == true) {
            event = UpdatesStateEvent(UpdatesStateEventType.CheckCompleteAvailable, body)
          }
          stateMachine.processEvent(event)
        }

        override fun onRemoteUpdateManifestResponseManifestLoaded(updateManifest: UpdateManifest) {
          remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADING
        }

        override fun onSuccess(launcher: Launcher, isUpToDate: Boolean) {
          if (remoteLoadStatus == ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADING && isUpToDate) {
            remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.IDLE
          }
          this@UpdatesController.launcher = launcher
          notifyController()
        }

        override fun onLoadUpdateStarted() {
          stateMachine.processEvent(UpdatesStateEvent(UpdatesStateEventType.Download))
        }

        override fun onAssetLoaded(
          asset: AssetEntity,
          successfulAssetCount: Int,
          failedAssetCount: Int,
          totalAssetCount: Int
        ) {
          val body = mapOf(
            "assetInfo" to mapOf(
              "name" to asset.embeddedAssetFilename,
              "successfulAssetCount" to successfulAssetCount,
              "failedAssetCount" to failedAssetCount,
              "totalAssetCount" to totalAssetCount
            )
          )
          logger.info("AppController appLoaderTask didLoadAsset: $body", UpdatesErrorCode.None, null, asset.expectedHash)
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
              logger.error("UpdatesController onBackgroundUpdateFinished: Error: ${exception.localizedMessage}", UpdatesErrorCode.Unknown, exception)
              remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.IDLE
              val params = Arguments.createMap()
              params.putString("message", exception.message)
              sendLegacyUpdateEventToJS(UPDATE_ERROR_EVENT, params)

              val body: Map<String, Any> = mapOf(
                "message" to (exception.message ?: "")
              )
              // Since errors can happen through a number of paths, we do these checks
              // to make sure the state machine is valid
              if (stateMachine.state == UpdatesStateValue.Idle) {
                stateMachine.processEvent(UpdatesStateEvent(UpdatesStateEventType.Download))
                stateMachine.processEvent(UpdatesStateEvent(UpdatesStateEventType.DownloadError, body))
              } else if (stateMachine.state == UpdatesStateValue.Checking) {
                stateMachine.processEvent(UpdatesStateEvent(UpdatesStateEventType.CheckError, body))
              } else {
                // .downloading
                stateMachine.processEvent(UpdatesStateEvent(UpdatesStateEventType.DownloadError, body))
              }
            }
            BackgroundUpdateStatus.UPDATE_AVAILABLE -> {
              if (update == null) {
                throw AssertionError("Background update with error status must have a nonnull update object")
              }
              remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADED
              logger.info("UpdatesController onBackgroundUpdateFinished: Update available", UpdatesErrorCode.None)
              val params = Arguments.createMap()
              params.putString("manifestString", update.manifest.toString())
              sendLegacyUpdateEventToJS(UPDATE_AVAILABLE_EVENT, params)
              val body = when (update.manifest != null) {
                true -> mapOf(
                  "manifest" to update.manifest!!
                )

                else -> mapOf()
              }
              stateMachine.processEvent(UpdatesStateEvent(UpdatesStateEventType.DownloadComplete, body))
            }
            BackgroundUpdateStatus.NO_UPDATE_AVAILABLE -> {
              remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.IDLE
              logger.error("UpdatesController onBackgroundUpdateFinished: No update available", UpdatesErrorCode.NoUpdatesAvailable)
              sendLegacyUpdateEventToJS(UPDATE_NO_UPDATE_AVAILABLE_EVENT, null)
              // TODO: handle rollbacks properly, but this works for now
              if (stateMachine.state == UpdatesStateValue.Downloading) {
                stateMachine.processEvent(UpdatesStateEvent(UpdatesStateEventType.DownloadComplete))
              }
            }
          }
          errorRecovery.notifyNewRemoteLoadStatus(remoteLoadStatus)
        }
      }
    )
    loaderTask!!.start(context)
  }

  @Synchronized
  private fun notifyController() {
    if (launcher == null) {
      throw AssertionError("UpdatesController.notifyController was called with a null launcher, which is an error. This method should only be called when an update is ready to launch.")
    }
    isLoaderTaskFinished = true
    (this as java.lang.Object).notify()
  }

  private fun initializeErrorRecovery(context: Context) {
    errorRecovery.initialize(object : ErrorRecoveryDelegate {
      override fun loadRemoteUpdate() {
        if (loaderTask?.isRunning == true) {
          return
        }
        remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADING
        val database = getDatabase()
        val remoteLoader = RemoteLoader(context, updatesConfiguration, database, fileDownloader, updatesDirectory, launchedUpdate)
        remoteLoader.start(object : Loader.LoaderCallback {
          override fun onFailure(e: Exception) {
            logger.error("UpdatesController loadRemoteUpdate onFailure: ${e.localizedMessage}", UpdatesErrorCode.UpdateFailedToLoad, launchedUpdate?.loggingId, null)
            setRemoteLoadStatus(ErrorRecoveryDelegate.RemoteLoadStatus.IDLE)
            releaseDatabase()
          }

          override fun onSuccess(loaderResult: Loader.LoaderResult) {
            setRemoteLoadStatus(
              if (loaderResult.updateEntity != null || loaderResult.updateDirective is UpdateDirective.RollBackToEmbeddedUpdateDirective) ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADED
              else ErrorRecoveryDelegate.RemoteLoadStatus.IDLE
            )
            releaseDatabase()
          }

          override fun onAssetLoaded(asset: AssetEntity, successfulAssetCount: Int, failedAssetCount: Int, totalAssetCount: Int) { }

          override fun onUpdateResponseLoaded(updateResponse: UpdateResponse): Loader.OnUpdateResponseLoadedResult {
            val updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective
            if (updateDirective != null) {
              return Loader.OnUpdateResponseLoadedResult(
                shouldDownloadManifestIfPresentInResponse = when (updateDirective) {
                  is UpdateDirective.RollBackToEmbeddedUpdateDirective -> false
                  is UpdateDirective.NoUpdateAvailableUpdateDirective -> false
                }
              )
            }

            val updateManifest = updateResponse.manifestUpdateResponsePart?.updateManifest ?: return Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = false)
            return Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = selectionPolicy.shouldLoadNewUpdate(updateManifest.updateEntity, launchedUpdate, updateResponse.responseHeaderData?.manifestFilters))
          }
        })
      }

      override fun relaunch(callback: LauncherCallback) { relaunchReactApplication(context, false, callback) }
      override fun throwException(exception: Exception) { throw exception }

      override fun markFailedLaunchForLaunchedUpdate() {
        if (isEmergencyLaunch) {
          return
        }
        databaseHandler.post {
          val launchedUpdate = launchedUpdate ?: return@post
          val database = getDatabase()
          database.updateDao().incrementFailedLaunchCount(launchedUpdate)
          releaseDatabase()
        }
      }

      override fun markSuccessfulLaunchForLaunchedUpdate() {
        if (isEmergencyLaunch) {
          return
        }
        databaseHandler.post {
          val launchedUpdate = launchedUpdate ?: return@post
          val database = getDatabase()
          database.updateDao().incrementSuccessfulLaunchCount(launchedUpdate)
          releaseDatabase()
        }
      }

      override fun getRemoteLoadStatus() = remoteLoadStatus
      override fun getCheckAutomaticallyConfiguration() = updatesConfiguration.checkOnLaunch
      override fun getLaunchedUpdateSuccessfulLaunchCount() = launchedUpdate?.successfulLaunchCount ?: 0
    })
  }

  fun runReaper() {
    AsyncTask.execute {
      val databaseLocal = getDatabase()
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
    relaunchReactApplication(context, true, callback)
  }

  private fun relaunchReactApplication(context: Context, shouldRunReaper: Boolean, callback: LauncherCallback) {
    val host = reactNativeHost?.get()
    if (host == null) {
      callback.onFailure(Exception("Could not reload application. Ensure you have passed the correct instance of ReactApplication into UpdatesController.initialize()."))
      return
    }

    stateMachine.processEvent(UpdatesStateEvent(UpdatesStateEventType.Restart))

    val oldLaunchAssetFile = launcher!!.launchAssetFile

    val databaseLocal = getDatabase()
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
          if (shouldRunReaper) {
            runReaper()
          }
          stateMachine.reset()
        }
      }
    )
  }

  override fun sendUpdateStateChangeEventToBridge(eventType: UpdatesStateEventType, fields: List<String>, values: Map<String, Any>) {
    sendEventToJS(UPDATES_STATE_CHANGE_EVENT_NAME, eventType.type, UpdatesStateMachine.paramsForJSEvent(fields, values))
  }

  fun sendLegacyUpdateEventToJS(eventType: String, params: WritableMap?) {
    sendEventToJS(UPDATES_EVENT_NAME, eventType, params)
  }

  fun sendEventToJS(
    eventName: String,
    eventType: String,
    params: WritableMap?
  ) {
    val host = reactNativeHost?.get()
    if (host != null) {
      AsyncTask.execute {
        try {
          var reactContext: ReactContext? = null
          // in case we're trying to send an event before the reactContext has been initialized
          // continue to retry for 5000ms
          for (i in 0..9) {
            // Calling host.reactInstanceManager has a side effect of creating a new
            // reactInstanceManager if there isn't already one. We want to avoid this so we check
            // if it has an instance first.
            if (host.hasInstance()) {
              reactContext = host.reactInstanceManager.currentReactContext
              if (reactContext != null) {
                break
              }
            }
            Thread.sleep(1000)
          }
          if (reactContext != null) {
            val emitter = reactContext.getJSModule(
              DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
            )
            if (emitter != null) {
              // Handle events in the initial queue first
              if (jsEventQueue.size > 0) {
                logger.info("${jsEventQueue.size} events found queued to send to JS")
                jsEventQueue.forEach {
                  val itParams = it["params"] as? WritableMap ?: Arguments.createMap()
                  val itEventType = it["eventType"] as? String ?: ""
                  val itEventName = it["eventName"] as? String ?: ""
                  itParams.putString("type", itEventType)
                  emitter.emit(itEventName, itParams)
                }
              }
              jsEventQueue = mutableListOf()
              // Now fire the new event
              var eventParams = params
              if (eventParams == null) {
                eventParams = Arguments.createMap()
              }
              eventParams!!.putString("type", eventType)
              logger.info("Emitting event with name = ${eventName}, type = ${eventType}")
              emitter.emit(eventName, eventParams)
              return@execute
            } else {
              logger.warn("Could not emit $eventType event; no event emitter was found. Event added to queue.", UpdatesErrorCode.Unknown)
              jsEventQueue.add(mapOf(
                "eventName" to eventName,
                "eventType" to eventType,
                "params" to (params ?: Arguments.createMap())
              ))
            }
          } else {
            logger.warn("Could not emit $eventType event; no react context was found. Event added to queue.", UpdatesErrorCode.Unknown)
            jsEventQueue.add(mapOf(
              "eventName" to eventName,
              "eventType" to eventType,
              "params" to (params ?: Arguments.createMap())
            ))
          }
        } catch (e: java.lang.Exception) {
          logger.warn("Could not emit $eventType event; no react context was found. Event added to queue.", UpdatesErrorCode.Unknown)
          jsEventQueue.add(mapOf(
            "eventName" to eventName,
            "eventType" to eventType,
            "params" to (params ?: Arguments.createMap())
          ))
        }
      }
    } else {
      logger.error(
        "Could not emit $eventType event; UpdatesController was not initialized with an instance of ReactApplication.",
        UpdatesErrorCode.Unknown
      )
    }
  }

  companion object {
    private val TAG = UpdatesController::class.java.simpleName

    private const val UPDATE_AVAILABLE_EVENT = "updateAvailable"
    private const val UPDATE_NO_UPDATE_AVAILABLE_EVENT = "noUpdateAvailable"
    private const val UPDATE_ERROR_EVENT = "error"

    private const val UPDATES_EVENT_NAME = "Expo.nativeUpdatesEvent"
    private const val UPDATES_STATE_CHANGE_EVENT_NAME = "Expo.nativeUpdatesStateChangeEvent"

    private var singletonInstance: UpdatesController? = null
    @JvmStatic val instance: UpdatesController
      get() {
        return checkNotNull(singletonInstance) { "UpdatesController.instance was called before the module was initialized" }
      }

    @JvmStatic fun initializeWithoutStarting(context: Context) {
      if (singletonInstance == null) {
        val updatesConfiguration = UpdatesConfiguration(context, null)
        singletonInstance = UpdatesController(context, updatesConfiguration)
      }
    }

    /**
     * Initializes the UpdatesController singleton. This should be called as early as possible in the
     * application's lifecycle.
     * @param context the base context of the application, ideally a [ReactApplication]
     */
    @JvmStatic fun initialize(context: Context) {
      if (singletonInstance == null) {
        initializeWithoutStarting(context)
        singletonInstance!!.start(context)
      }
    }

    /**
     * Initializes the UpdatesController singleton. This should be called as early as possible in the
     * application's lifecycle. Use this method to set or override configuration values at runtime
     * rather than from AndroidManifest.xml.
     * @param context the base context of the application, ideally a [ReactApplication]
     */
    @JvmStatic fun initialize(context: Context, configuration: Map<String, Any>) {
      if (singletonInstance == null) {
        val updatesConfiguration = UpdatesConfiguration(context, configuration)
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
