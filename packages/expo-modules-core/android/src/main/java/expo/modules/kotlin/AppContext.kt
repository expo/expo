package expo.modules.kotlin

import android.app.Activity
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.interfaces.barcodescanner.BarCodeScannerInterface
import expo.modules.interfaces.camera.CameraViewInterface
import expo.modules.interfaces.constants.ConstantsInterface
import expo.modules.interfaces.filesystem.FilePermissionModuleInterface
import expo.modules.interfaces.font.FontManagerInterface
import expo.modules.interfaces.imageloader.ImageLoaderInterface
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.sensors.SensorServiceInterface
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.kotlin.defaultmodules.ErrorManagerModule
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.events.KEventEmitterWrapper
import expo.modules.kotlin.events.OnActivityResultPayload
import expo.modules.kotlin.modules.Module
import java.lang.ref.WeakReference

class AppContext(
  modulesProvider: ModulesProvider,
  val legacyModuleRegistry: expo.modules.core.ModuleRegistry,
  private val reactContextHolder: WeakReference<ReactApplicationContext>
) {
  val registry = ModuleRegistry(WeakReference(this)).apply {
    register(ErrorManagerModule())
    register(modulesProvider)
  }
  private val reactLifecycleDelegate = ReactLifecycleDelegate(this)

  init {
    requireNotNull(reactContextHolder.get()) {
      "The app context should be created with valid react context."
    }.apply {
      addLifecycleEventListener(reactLifecycleDelegate)
      addActivityEventListener(reactLifecycleDelegate)
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
    val legacyEventEmitter = legacyModule<EventEmitter>() ?: return null
    return KEventEmitterWrapper(
      requireNotNull(registry.getModuleHolder(module)) {
        "Cannot create an event emitter for the module that isn't present in the module registry."
      },
      legacyEventEmitter
    )
  }

  internal val callbackInvoker: EventEmitter?
    get() = legacyModule()

  internal val errorManager: ErrorManagerModule?
    get() = registry.getModule()

  fun onDestroy() {
    reactContextHolder.get()?.removeLifecycleEventListener(reactLifecycleDelegate)
    registry.post(EventName.MODULE_DESTROY)
  }

  fun onHostResume() {
    registry.post(EventName.ACTIVITY_ENTERS_FOREGROUND)
  }

  fun onHostPause() {
    registry.post(EventName.ACTIVITY_ENTERS_BACKGROUND)
  }

  fun onHostDestroy() {
    registry.post(EventName.ACTIVITY_DESTROYS)
  }

  fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
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
}
