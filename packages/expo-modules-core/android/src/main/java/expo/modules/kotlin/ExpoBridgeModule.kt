package expo.modules.kotlin

import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import expo.modules.adapters.react.NativeModulesProxy
import java.lang.ref.WeakReference

/**
 * The classic bridge module that is responsible for installing the host object to the runtime.
 */
class ExpoBridgeModule(private val nativeModulesProxy: WeakReference<NativeModulesProxy>) : ReactContextBaseJavaModule() {
  override fun getName(): String = "ExpoModulesCore"

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun installModules(): Boolean {
    val kotlinInterop = nativeModulesProxy.get()?.kotlinInteropModuleRegistry
      ?: throw IllegalStateException("Couldn't find KotlinInteropModuleRegistry")

    kotlinInterop.installJSIInterop()
    return true
  }
}
