package expo.modules.kotlin

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.HandlerThread
import android.view.View
import androidx.annotation.UiThread
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.common.UIManagerType
import expo.modules.adapters.react.NativeModulesProxy
import expo.modules.core.errors.ContextDestroyedException
import expo.modules.core.errors.ModuleNotFoundException
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.utilities.ifNull
import expo.modules.interfaces.barcodescanner.BarCodeScannerInterface
import expo.modules.interfaces.camera.CameraViewInterface
import expo.modules.interfaces.constants.ConstantsInterface
import expo.modules.interfaces.filesystem.AppDirectoriesModuleInterface
import expo.modules.interfaces.filesystem.FilePermissionModuleInterface
import expo.modules.interfaces.font.FontManagerInterface
import expo.modules.interfaces.imageloader.ImageLoaderInterface
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.sensors.SensorServiceInterface
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.kotlin.activityresult.ActivityResultsManager
import expo.modules.kotlin.activityresult.DefaultAppContextActivityResultCaller
import expo.modules.kotlin.defaultmodules.CoreModule
import expo.modules.kotlin.defaultmodules.ErrorManagerModule
import expo.modules.kotlin.defaultmodules.NativeModulesProxyModule
import expo.modules.kotlin.events.EventEmitter
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.events.KEventEmitterWrapper
import expo.modules.kotlin.events.KModuleEventEmitterWrapper
import expo.modules.kotlin.events.OnActivityResultPayload
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.jni.JNIDeallocator
import expo.modules.kotlin.jni.JSIContext
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.providers.CurrentActivityProvider
import expo.modules.kotlin.sharedobjects.ClassRegistry
import expo.modules.kotlin.sharedobjects.SharedObjectRegistry
import expo.modules.kotlin.tracing.trace
import kotlinx.coroutines.CoroutineName
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.android.asCoroutineDispatcher
import kotlinx.coroutines.cancel
import java.io.File
import java.lang.ref.WeakReference

class AppContext(
  modulesProvider: ModulesProvider,
  val legacyModuleRegistry: expo.modules.core.ModuleRegistry,
  private val reactContextHolder: WeakReference<ReactApplicationContext>
) : CurrentActivityProvider {
  val registry = ModuleRegistry(WeakReference(this))
  private val reactLifecycleDelegate = ReactLifecycleDelegate(this)

  private var hostWasDestroyed = false

  // We postpone creating the `JSIContext` to not load so files in unit tests.
  internal lateinit var jsiInterop: JSIContext

  /**
   * The core module that defines the `expo` object in the global scope of the JS runtime.
   *
   * Note: in current implementation this module won't receive any events.
   */
  internal val coreModule = run {
    val module = CoreModule()
    module._appContext = this
    ModuleHolder(module)
  }

  internal val sharedObjectRegistry = SharedObjectRegistry(this)

  internal val classRegistry = ClassRegistry()

  private val modulesQueueDispatcher = HandlerThread("expo.modules.AsyncFunctionQueue")
    .apply { start() }
    .looper.let { Handler(it) }
    .asCoroutineDispatcher()

  /**
   * A scope used to dispatch all background work.
   */
  val backgroundCoroutineScope = CoroutineScope(
    Dispatchers.IO +
      SupervisorJob() +
      CoroutineName("expo.modules.BackgroundCoroutineScope")
  )

  /**
   * A queue used to dispatch all async methods that are called via JSI.
   */
  val modulesQueue = CoroutineScope(
    modulesQueueDispatcher +
      SupervisorJob() +
      CoroutineName("expo.modules.AsyncFunctionQueue")
  )

  val mainQueue = CoroutineScope(
    Dispatchers.Main +
      SupervisorJob() +
      CoroutineName("expo.modules.MainQueue")
  )

  val jniDeallocator: JNIDeallocator = JNIDeallocator()

  internal var legacyModulesProxyHolder: WeakReference<NativeModulesProxy>? = null

  private val activityResultsManager = ActivityResultsManager(this)
  internal val appContextActivityResultCaller = DefaultAppContextActivityResultCaller(activityResultsManager)

  init {
    requireNotNull(reactContextHolder.get()) {
      "The app context should be created with valid react context."
    }.apply {
      addLifecycleEventListener(reactLifecycleDelegate)
      addActivityEventListener(reactLifecycleDelegate)

      // Registering modules has to happen at the very end of `AppContext` creation. Some modules need to access
      // `AppContext` during their initialisation, so we need to ensure all `AppContext`'s
      // properties are initialized first. Not having that would trigger NPE.
      registry.register(ErrorManagerModule())
      registry.register(NativeModulesProxyModule())
      registry.register(modulesProvider)

      logger.info("✅ AppContext was initialized")
    }
  }

  fun onCreate() = trace("AppContext.onCreate") {
    registry.postOnCreate()
  }

  /**
   * Initializes a JSI part of the module registry.
   * It will be a NOOP if the remote debugging was activated.
   */
  @OptIn(FrameworkAPI::class)
  fun installJSIInterop() = synchronized(this) {
    if (::jsiInterop.isInitialized) {
      logger.warn("⚠️ JSI interop was already installed")
      return
    }

    trace("AppContext.installJSIInterop") {
      try {
        jsiInterop = JSIContext()
        val reactContext = reactContextHolder.get() ?: return@trace
        val jsContextHolder = reactContext.javaScriptContextHolder?.get() ?: return@trace

        val jsRuntimePointer = jsContextHolder.takeIf { it != 0L }.ifNull {
          logger.error("❌ Cannot install JSI interop - JS runtime pointer is null")
          return@trace
        }

        @Suppress("DEPRECATION")
        if (reactContext.isBridgeless) {
          jsiInterop.installJSIForBridgeless(
            this,
            jsRuntimePointer,
            jniDeallocator,
            reactContext.runtimeExecutor!!
          )
        } else {
          jsiInterop.installJSI(
            this,
            jsRuntimePointer,
            jniDeallocator,
            reactContext.catalystInstance.jsCallInvokerHolder as CallInvokerHolderImpl
          )
        }

        logger.info("✅ JSI interop was installed")
      } catch (e: Throwable) {
        logger.error("❌ Cannot install JSI interop: $e", e)
      }
    }
  }

  /**
   * Returns a legacy module implementing given interface.
   */
  inline fun <reified Module> legacyModule(): Module? {
    return try {
      legacyModuleRegistry.getModule(Module::class.java)
    } catch (_: Exception) {
      null
    }
  }

  /**
   * Provides access to app's constants from the legacy module registry.
   */
  val constants: ConstantsInterface?
    get() = legacyModule()

  /**
   * Provides access to the file system manager from the legacy module registry.
   */
  val filePermission: FilePermissionModuleInterface?
    get() = legacyModule()

  /**
   * Provides access to the scoped directories from the legacy module registry.
   */
  private val appDirectories: AppDirectoriesModuleInterface?
    get() = legacyModule()

  /**
   * A directory for storing user documents and other permanent files.
   */
  val persistentFilesDirectory: File
    get() = appDirectories?.persistentFilesDirectory
      ?: throw ModuleNotFoundException("expo.modules.interfaces.filesystem.AppDirectories")

  /**
   * A directory for storing temporary files that can be removed at any time by the device's operating system.
   */
  val cacheDirectory: File
    get() = appDirectories?.cacheDirectory
      ?: throw ModuleNotFoundException("expo.modules.interfaces.filesystem.AppDirectories")

  /**
   * Provides access to the permissions manager from the legacy module registry
   */
  val permissions: Permissions?
    get() = legacyModule()

  /**
   * Provides access to the image loader from the legacy module registry
   */
  val imageLoader: ImageLoaderInterface?
    get() = legacyModule()

  /**
   * Provides access to the bar code scanner manager from the legacy module registry
   */
  val barcodeScanner: BarCodeScannerInterface?
    get() = legacyModule()

  /**
   * Provides access to the camera view manager from the legacy module registry
   */
  val camera: CameraViewInterface?
    get() = legacyModule()

  /**
   * Provides access to the font manager from the legacy module registry
   */
  val font: FontManagerInterface?
    get() = legacyModule()

  /**
   * Provides access to the sensor manager from the legacy module registry
   */
  val sensor: SensorServiceInterface?
    get() = legacyModule()

  /**
   * Provides access to the task manager from the legacy module registry
   */
  val taskManager: TaskManagerInterface?
    get() = legacyModule()

  /**
   * Provides access to the activity provider from the legacy module registry
   */
  val activityProvider: ActivityProvider?
    get() = legacyModule()

  /**
   * Provides access to the react application context
   */
  val reactContext: Context?
    get() = reactContextHolder.get()

  /**
   * @return true if there is an non-null, alive react native instance
   */
  val hasActiveReactInstance: Boolean
    get() = reactContextHolder.get()?.hasActiveReactInstance() ?: false

  /**
   * Provides access to the event emitter
   */
  fun eventEmitter(module: Module): EventEmitter? {
    val legacyEventEmitter = legacyModule<expo.modules.core.interfaces.services.EventEmitter>()
      ?: return null
    return KModuleEventEmitterWrapper(
      requireNotNull(registry.getModuleHolder(module)) {
        "Cannot create an event emitter for the module that isn't present in the module registry."
      },
      legacyEventEmitter,
      reactContextHolder
    )
  }

  internal val callbackInvoker: EventEmitter?
    get() {
      val legacyEventEmitter = legacyModule<expo.modules.core.interfaces.services.EventEmitter>()
        ?: return null
      return KEventEmitterWrapper(legacyEventEmitter, reactContextHolder)
    }

  val errorManager: ErrorManagerModule?
    get() = registry.getModule()

  internal fun onDestroy() = trace("AppContext.onDestroy") {
    reactContextHolder.get()?.removeLifecycleEventListener(reactLifecycleDelegate)
    registry.post(EventName.MODULE_DESTROY)
    registry.cleanUp()
    coreModule.module._appContext = null
    modulesQueue.cancel(ContextDestroyedException())
    mainQueue.cancel(ContextDestroyedException())
    backgroundCoroutineScope.cancel(ContextDestroyedException())
    jniDeallocator.deallocate()
    logger.info("✅ AppContext was destroyed")
  }

  internal fun onHostResume() {
    val activity = currentActivity
    check(activity is AppCompatActivity) {
      "Current Activity is of incorrect class, expected AppCompatActivity, received ${currentActivity?.localClassName}"
    }

    // We need to re-register activity contracts when reusing AppContext with new Activity after host destruction.
    if (hostWasDestroyed) {
      hostWasDestroyed = false
      registry.registerActivityContracts()
    }

    activityResultsManager.onHostResume(activity)
    registry.post(EventName.ACTIVITY_ENTERS_FOREGROUND)
  }

  internal fun onHostPause() {
    registry.post(EventName.ACTIVITY_ENTERS_BACKGROUND)
  }

  internal fun onHostDestroy() {
    currentActivity?.let {
      check(it is AppCompatActivity) {
        "Current Activity is of incorrect class, expected AppCompatActivity, received ${currentActivity?.localClassName}"
      }

      activityResultsManager.onHostDestroy(it)
    }
    registry.post(EventName.ACTIVITY_DESTROYS)
    // The host (Activity) was destroyed, but it doesn't mean that modules will be destroyed too.
    // So we save that information, and we will re-register activity contracts when the host will be resumed with new Activity.
    hostWasDestroyed = true
  }

  internal fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    activityResultsManager.onActivityResult(requestCode, resultCode, data)
    registry.post(
      EventName.ON_ACTIVITY_RESULT,
      activity,
      OnActivityResultPayload(
        requestCode,
        resultCode,
        data
      )
    )
  }

  internal fun onNewIntent(intent: Intent?) {
    registry.post(
      EventName.ON_NEW_INTENT,
      intent
    )
  }

  @Suppress("UNCHECKED_CAST")
  @UiThread
  fun <T : View> findView(viewTag: Int): T? {
    val reactContext = reactContextHolder.get() ?: return null
    return UIManagerHelper.getUIManagerForReactTag(reactContext, viewTag)?.resolveView(viewTag) as? T
  }

  internal fun dispatchOnMainUsingUIManager(block: () -> Unit) {
    val reactContext = reactContextHolder.get() ?: throw Exceptions.ReactContextLost()
    val uiManager = UIManagerHelper.getUIManagerForReactTag(
      reactContext,
      UIManagerType.DEFAULT
    ) as UIManagerModule

    uiManager.addUIBlock {
      block()
    }
  }

  internal fun assertMainThread() {
    Utils.assertMainThread()
  }

  /**
   * Runs a code block on the JavaScript thread.
   */
  fun executeOnJavaScriptThread(runnable: Runnable) {
    reactContextHolder.get()?.runOnJSQueueThread(runnable)
  }

// region CurrentActivityProvider

  override val currentActivity: Activity?
    get() {
      return activityProvider?.currentActivity
        ?: (reactContext as? ReactApplicationContext)?.currentActivity
    }

// endregion
}
