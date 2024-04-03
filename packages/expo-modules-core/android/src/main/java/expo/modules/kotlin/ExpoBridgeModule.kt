package expo.modules.kotlin

import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * The classic bridge module that is responsible for installing the host object to the runtime.
 */
class ExpoBridgeModule(private val context: ReactContext) : ReactContextBaseJavaModule() {
  override fun getName(): String = "ExpoModulesCore"

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun installModules() {
    val nativeModulesProxy = context.getUnimoduleProxy()
    val kotlinInterop = nativeModulesProxy?.kotlinInteropModuleRegistry
      ?: throw IllegalStateException("Couldn't find KotlinInteropModuleRegistry")

    kotlinInterop.installJSIInterop()
  }
}
