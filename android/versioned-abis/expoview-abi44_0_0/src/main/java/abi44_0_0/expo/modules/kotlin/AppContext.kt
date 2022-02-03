package abi44_0_0.expo.modules.kotlin

import android.app.Activity
import android.content.Context
import android.content.Intent
import abi44_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi44_0_0.expo.modules.core.interfaces.ActivityProvider
import abi44_0_0.expo.modules.core.interfaces.services.EventEmitter
import abi44_0_0.expo.modules.interfaces.barcodescanner.BarCodeScannerInterface
import abi44_0_0.expo.modules.interfaces.camera.CameraViewInterface
import abi44_0_0.expo.modules.interfaces.constants.ConstantsInterface
import abi44_0_0.expo.modules.interfaces.filesystem.FilePermissionModuleInterface
import abi44_0_0.expo.modules.interfaces.font.FontManagerInterface
import abi44_0_0.expo.modules.interfaces.imageloader.ImageLoaderInterface
import abi44_0_0.expo.modules.interfaces.permissions.Permissions
import abi44_0_0.expo.modules.interfaces.sensors.SensorServiceInterface
import expo.modules.interfaces.taskManager.TaskManagerInterface
import abi44_0_0.expo.modules.kotlin.events.EventName
import abi44_0_0.expo.modules.kotlin.events.KEventEmitterWrapper
import abi44_0_0.expo.modules.kotlin.events.OnActivityResultPayload
import abi44_0_0.expo.modules.kotlin.modules.Module
import java.lang.ref.WeakReference

class AppContext(
  modulesProvider: ModulesProvider,
  val legacyModuleRegistry: abi44_0_0.expo.modules.core.ModuleRegistry,
  private val reactContextHolder: WeakReference<ReactApplicationContext>
) {
  val registry = ModuleRegistry(WeakReference(this)).register(modulesProvider)
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
