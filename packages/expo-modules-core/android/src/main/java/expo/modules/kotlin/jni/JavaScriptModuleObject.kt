package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import com.facebook.react.bridge.ReadableNativeArray
import expo.modules.kotlin.ModuleHolder
import java.lang.ref.WeakReference

class JavaScriptModuleObject(moduleHolder: ModuleHolder) {
  // Has to be called "mHybridData" - fbjni uses it via reflection
  private val mHybridData = initHybrid()
  private val moduleHolderRef = WeakReference(moduleHolder)

  @Suppress("KotlinJniMissingFunction")
  private external fun initHybrid(): HybridData

  @Suppress("KotlinJniMissingFunction")
  external fun registerSyncFunction(name: String, args: Int)

  fun callSyncMethod(name: String, args: ReadableNativeArray): ReadableNativeArray? {
    return moduleHolderRef.get()?.callSync(name, args)
  }

  @Throws(Throwable::class)
  protected fun finalize() {
    mHybridData.resetNative()
  }
}
