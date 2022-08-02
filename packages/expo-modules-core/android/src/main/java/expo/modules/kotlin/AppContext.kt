@file:OptIn(DelicateCoroutinesApi::class)

package expo.modules.kotlin

import android.app.Activity
import android.content.Context
import android.content.Intent
import androidx.annotation.MainThread
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import expo.modules.core.errors.ContextDestroyedException
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.interfaces.barcodescanner.BarCodeScannerInterface
import expo.modules.interfaces.camera.CameraViewInterface
import expo.modules.interfaces.constants.ConstantsInterface
import expo.modules.interfaces.filesystem.FilePermissionModuleInterface
import expo.modules.interfaces.font.FontManagerInterface
import expo.modules.interfaces.imageloader.ImageLoaderInterface
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.sensors.SensorServiceInterface
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.kotlin.activityresult.ActivityResultsManager
import expo.modules.kotlin.activityresult.AppContextActivityResultFallbackCallback
import expo.modules.kotlin.activityresult.AppContextActivityResultCaller
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.defaultmodules.ErrorManagerModule
import expo.modules.kotlin.events.EventEmitter
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.events.KEventEmitterWrapper
import expo.modules.kotlin.events.KModuleEventEmitterWrapper
import expo.modules.kotlin.events.OnActivityResultPayload
import expo.modules.kotlin.jni.JSIInteropModuleRegistry
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.providers.CurrentActivityProvider
import kotlinx.coroutines.CoroutineName
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.newSingleThreadContext
import java.io.Serializable
import java.lang.ref.WeakReference

class AppContext(
  modulesProvider: ModulesProvider,
  val legacyModuleRegistry: expo.modules.core.ModuleRegistry,
  private val reactContextHolder: WeakReference<ReactApplicationContext>
) : CurrentActivityProvider, AppContextActivityResultCaller {
  val registry = ModuleRegistry(WeakReference(this)).apply {
  }
  private val reactLifecycleDelegate = ReactLifecycleDelegate(this)

  // We postpone creating the `JSIInteropModuleRegistry` to not load so files in unit tests.
  private lateinit var jsiInterop: JSIInteropModuleRegistry

  /**
   * A queue used to dispatch all async methods that are called via JSI.
   */
  internal val modulesQueue = CoroutineScope(
    // TODO(@lukmccall): maybe it will be better to use a thread pool
    newSingleThreadContext("ExpoModulesCoreQueue") +
      SupervisorJob() +
      CoroutineName("ExpoModulesCoreCoroutineQueue")
  )

  private val activityResultsManager = ActivityResultsManager(this)

  init {
    requireNotNull(reactContextHolder.get()) {
      "The app context should be created with valid react context."
    }.apply {
      addLifecycleEventListener(reactLifecycleDelegate)
      addActivityEventListener(reactLifecycleDelegate)

      // Registering modules has to happen at the very end of `AppContext` creation. Some modules need to access
      // `AppContext` during their initialisation (or during `OnCreate` method), so we need to ensure all `AppContext`'s
      // properties are initialized first. Not having that would trigger NPE.
      registry.register(ErrorManagerModule())
      registry.register(modulesProvider)
    }
  }

  /**
   * Initializes a JSI part of the module registry.
   * It will be a NOOP if the remote debugging was activated.
   */
  fun installJSIInterop() {
    jsiInterop = JSIInteropModuleRegistry(this)
    val reactContext = reactContextHolder.get() ?: return
    reactContext.javaScriptContextHolder?.get()
      ?.takeIf { it != 0L }
      ?.let {
        jsiInterop.installJSI(
          it,
          reactContext.catalystInstance.jsCallInvokerHolder as CallInvokerHolderImpl,
          reactContext.catalystInstance.nativeCallInvokerHolder as CallInvokerHolderImpl
        )
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

  internal val errorManager: ErrorManagerModule?
    get() = registry.getModule()

  fun onDestroy() {
    reactContextHolder.get()?.removeLifecycleEventListener(reactLifecycleDelegate)
    registry.post(EventName.MODULE_DESTROY)
    registry.cleanUp()
    modulesQueue.cancel(ContextDestroyedException())
  }

  fun onHostResume() {
    activityResultsManager.onHostResume(
      requireNotNull(currentActivity) {
        "Current Activity is not available at this moment. This is an invalid state and this should never happen"
      }
    )
    registry.post(EventName.ACTIVITY_ENTERS_FOREGROUND)
  }

  fun onHostPause() {
    registry.post(EventName.ACTIVITY_ENTERS_BACKGROUND)
  }

  fun onHostDestroy() {
    activityResultsManager.onHostDestroy(
      requireNotNull(currentActivity) {
        "Current Activity is not available at this moment. This is an invalid state and this should never happen"
      }
    )
    registry.post(EventName.ACTIVITY_DESTROYS)
  }

  fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    activityResultsManager.onActivityResult(activity, requestCode, resultCode, data)
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

  fun onNewIntent(intent: Intent?) {
    registry.post(
      EventName.ON_NEW_INTENT,
      intent
    )
  }

// region CurrentActivityProvider

  override val currentActivity: AppCompatActivity?
    get() {
      val currentActivity = this.activityProvider?.currentActivity ?: return null

      check(currentActivity is AppCompatActivity) {
        "Current Activity is of incorrect class, expected AppCompatActivity, received ${currentActivity.localClassName}"
      }

      return currentActivity
    }

// endregion

// region AppContextActivityResultCaller

  /**
   * For the time being [fallbackCallback] is not working.
   * There are some problems with saving and restoring the state of [activityResultsManager]
   * connected with [Activity]'s lifecycle and [AppContext] lifespan. So far, we've failed with identifying
   * what parts of the application outlives the Activity destruction (especially [AppContext] and other [Bridge]-related parts).
   */
  @MainThread
  override suspend fun <I : Serializable, O> registerForActivityResult(
    contract: AppContextActivityResultContract<I, O>,
    fallbackCallback: AppContextActivityResultFallbackCallback<I, O>
  ): AppContextActivityResultLauncher<I, O> =
    activityResultsManager.registerForActivityResult(contract, fallbackCallback)

// endregion
}
