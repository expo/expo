package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import expo.modules.kotlin.AppContext
import java.lang.ref.WeakReference

class JSIInteropModuleRegistry(appContext: AppContext) {
  private val appContextHolder = WeakReference(appContext)

  // Has to be called "mHybridData" - fbjni uses it via reflection
  private val mHybridData = initHybrid()

  @Suppress("KotlinJniMissingFunction")
  private external fun initHybrid(): HybridData

  @Suppress("KotlinJniMissingFunction")
  external fun installJSI(jsRuntimePointer: Long)

  // used from cpp codebase
  fun getJavaScriptModuleObject(name: String): JavaScriptModuleObject? {
    return appContextHolder.get()?.registry?.getModuleHolder(name)?.jsObject
  }

  @Throws(Throwable::class)
  protected fun finalize() {
    mHybridData.resetNative()
  }

  companion object {
    init {
      System.loadLibrary("expo-modules-core")
    }
  }
}
