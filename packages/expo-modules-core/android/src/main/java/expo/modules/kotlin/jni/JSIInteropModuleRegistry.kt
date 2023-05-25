package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import com.facebook.soloader.SoLoader
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.JavaScriptEvaluateException
import expo.modules.kotlin.sharedobjects.SharedObject
import java.lang.ref.WeakReference

/**
 * Despite the fact that this class is marked as [Destructible], it is not included in the [JNIDeallocator].
 * The deallocation of the [JSIInteropModuleRegistry] should be performed at the very end
 * to prevent the destructor of the [Destructible] object from accessing data that has already been freed.
 */
@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class JSIInteropModuleRegistry(appContext: AppContext) : Destructible {

  internal val appContextHolder = WeakReference(appContext)

  // Has to be called "mHybridData" - fbjni uses it via reflection
  @DoNotStrip
  private val mHybridData = initHybrid()

  private external fun initHybrid(): HybridData

  /**
   * Initializes the `ExpoModulesHostObject` and adds it to the global object.
   */
  external fun installJSI(
    jsRuntimePointer: Long,
    jniDeallocator: JNIDeallocator,
    jsInvokerHolder: CallInvokerHolderImpl,
    nativeInvokerHolder: CallInvokerHolderImpl
  )

  /**
   * Initializes the test runtime. Shouldn't be used in the production.
   */
  external fun installJSIForTests(
    jniDeallocator: JNIDeallocator,
  )

  fun installJSIForTests() = installJSIForTests(
    JNIDeallocator(shouldCreateDestructorThread = false)
  )

  /**
   * Evaluates given JavaScript source code.
   * @throws JavaScriptEvaluateException if the input format is unknown or evaluation causes an error
   */
  @Throws(JavaScriptEvaluateException::class)
  external fun evaluateScript(script: String): JavaScriptValue

  /**
   * Returns the runtime global object
   */
  external fun global(): JavaScriptObject

  /**
   * Returns a new instance of [JavaScriptObject]
   */
  external fun createObject(): JavaScriptObject

  /**
   * Drains the JavaScript VM internal Microtask (a.k.a. event loop) queue.
   */
  external fun drainJSEventLoop()

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

  @Suppress("unused")
  @DoNotStrip
  fun hasModule(name: String): Boolean {
    return appContextHolder.get()?.registry?.hasModule(name) ?: false
  }

  /**
   * Returns an array that contains names of available modules.
   */
  @Suppress("unused")
  @DoNotStrip
  fun getJavaScriptModulesName(): Array<String> {
    return appContextHolder.get()?.registry?.registry?.keys?.toTypedArray() ?: emptyArray()
  }

  @Suppress("unused")
  @DoNotStrip
  fun registerSharedObject(native: Any, js: JavaScriptObject) {
    appContextHolder
      .get()
      ?.sharedObjectRegistry
      ?.add(native as SharedObject, js)
  }

  @Throws(Throwable::class)
  protected fun finalize() {
    deallocate()
  }

  override fun deallocate() {
    mHybridData.resetNative()
  }

  companion object {
    init {
      SoLoader.loadLibrary("expo-modules-core")
    }
  }
}
