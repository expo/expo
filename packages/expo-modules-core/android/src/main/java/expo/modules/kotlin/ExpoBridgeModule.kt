package expo.modules.kotlin

import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import expo.modules.adapters.react.NativeModulesProxy

/**
 * The classic bridge module that is responsible for installing the host object to the runtime.
 */
class ExpoBridgeModule(private val context: ReactContext) : ReactContextBaseJavaModule() {
  override fun getName(): String = "ExpoModulesCore"

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun installModules() {
    val nativeModulesProxy = context.getNativeModule(NativeModulesProxy::class.java)
    val kotlinInterop = nativeModulesProxy?.kotlinInteropModuleRegistry
      ?: throw IllegalStateException("Couldn't find KotlinInteropModuleRegistry")

    kotlinInterop.installJSIInterop()
  }
}
