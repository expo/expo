package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableNativeArray
import expo.modules.kotlin.KPromiseWrapper
import expo.modules.kotlin.ModuleHolder
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference

class JavaScriptModuleObject(moduleHolder: ModuleHolder) {
  // Has to be called "mHybridData" - fbjni uses it via reflection
  private val mHybridData = initHybrid()
  private val moduleHolderRef = WeakReference(moduleHolder)

  @Suppress("KotlinJniMissingFunction")
  private external fun initHybrid(): HybridData

  @Suppress("KotlinJniMissingFunction")
  external fun registerSyncFunction(name: String, args: Int)

  @Suppress("KotlinJniMissingFunction")
  external fun registerAsyncFunction(name: String, args: Int)

  @Suppress("unused")
  fun callSyncMethod(name: String, args: ReadableNativeArray): ReadableNativeArray? {
    return moduleHolderRef.get()?.callSync(name, args)
  }

  @OptIn(DelicateCoroutinesApi::class)
  @Suppress("unused")
  fun callAsyncMethod(name: String, args: ReadableNativeArray, bridgePromise: Any) {
    val kotlinPromise = KPromiseWrapper(bridgePromise as Promise)
    moduleHolderRef.get()?.let { holder ->
      holder.module.appContext.moduleQueue.launch {
        moduleHolderRef.get()?.call(name, args, kotlinPromise)
      }
    }
  }

  @Throws(Throwable::class)
  protected fun finalize() {
    mHybridData.resetNative()
  }
}
