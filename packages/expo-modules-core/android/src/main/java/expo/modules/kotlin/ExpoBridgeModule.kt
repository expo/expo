package expo.modules.kotlin

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import expo.modules.adapters.react.NativeModulesProxy
import java.lang.ref.WeakReference

/**
 * The classic bridge module that is responsible for installing the host object to the runtime.
 */
class ExpoBridgeModule(
  reactContext: ReactApplicationContext,
  private val nativeModulesProxy: WeakReference<NativeModulesProxy>
) :
  ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "ExpoModulesCore"

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun installModules(): Boolean {
    // Bridgeless ReactHostImpl may have BridgelessReactContext ready but not ReactInstance.
    // Try to busy wait until ReactInstance is available so we could get the javaScriptContextHolder.
    tryWaitSync(waitMs = 100, retries = 10) {
      reactApplicationContext.hasActiveReactInstance()
    }
    val kotlinInterop = nativeModulesProxy.get()?.kotlinInteropModuleRegistry
      ?: throw IllegalStateException("Couldn't find KotlinInteropModuleRegistry")

    kotlinInterop.installJSIInterop()
    return true
  }

  private fun tryWaitSync(waitMs: Long, retries: Int, predicate: () -> Boolean) {
    repeat(retries) inner@{
      if (predicate()) {
        return
      }
      Thread.sleep(waitMs)
    }
  }
}
