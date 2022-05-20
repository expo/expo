package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.JavaScriptEvaluateException
import java.lang.ref.WeakReference

@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class JSIInteropModuleRegistry(appContext: AppContext) {
  private val appContextHolder = WeakReference(appContext)

  // Has to be called "mHybridData" - fbjni uses it via reflection
  @DoNotStrip
  private val mHybridData = initHybrid()

  private external fun initHybrid(): HybridData

  external fun installJSI(
    jsRuntimePointer: Long,
    jsInvokerHolder: CallInvokerHolderImpl,
    nativeInvokerHolder: CallInvokerHolderImpl
  )

  external fun installJSIForTests()

  @Throws(JavaScriptEvaluateException::class)
  external fun evaluateScript(script: String): JavaScriptValue

  external fun global(): JavaScriptObject

  /**
   * Returns a `JavaScriptModuleObject` that is a bridge between [expo.modules.kotlin.modules.Module]
   * and HostObject exported via JSI.
   *
   * This function will be called from the CPP implementation.
   * It doesn't make sense to call it from Kotlin.
   */
  @Suppress("unused")
  @DoNotStrip
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
