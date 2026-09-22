package expo.modules.kotlin

import android.util.Log
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
    val ready = tryWaitSync(waitMs = 100, retries = 10) {
      reactApplicationContext.hasActiveReactInstance()
    }
    if (!ready) {
      // Don't fall through silently: without an active ReactInstance, installJSIInterop()
      // below installs nothing into the runtime and this method still returns true, so the
      // first visible symptom is JS reading `globalThis.expo` as undefined ("Cannot read
      // property 'EventEmitter' of undefined") — far from the cause.
      Log.w(
        "ExpoBridgeModule",
        "hasActiveReactInstance() is still false after waiting; installing JSI interop anyway. " +
          "globalThis.expo will most likely be missing in the JS runtime."
      )
    }
    val kotlinInterop = nativeModulesProxy.get()?.kotlinInteropModuleRegistry
      ?: throw IllegalStateException("Couldn't find KotlinInteropModuleRegistry")

    kotlinInterop.installJSIInterop()
    return true
  }

  /**
   * Returns whether the predicate became true within the given budget.
   */
  private fun tryWaitSync(waitMs: Long, retries: Int, predicate: () -> Boolean): Boolean {
    repeat(retries) {
      if (predicate()) {
        return true
      }
      Thread.sleep(waitMs)
    }
    return predicate()
  }
}
