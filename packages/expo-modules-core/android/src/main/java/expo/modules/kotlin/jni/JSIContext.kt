package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.exception.JavaScriptEvaluateException
import expo.modules.kotlin.runtime.RuntimeContext
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.sharedobjects.SharedObjectId
import java.lang.ref.WeakReference

/**
 * Despite the fact that this class is marked as [Destructible], it is not included in the [JNIDeallocator].
 * The deallocation of the [JSIContext] should be performed at the very end
 * to prevent the destructor of the [Destructible] object from accessing data that has already been freed.
 */
@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class JSIContext @DoNotStrip internal constructor(
  @DoNotStrip private val mHybridData: HybridData,
  val runtimeContextHolder: WeakReference<RuntimeContext>
) : Destructible, AutoCloseable {
  /**
   * Evaluates given JavaScript source code.
   * @throws JavaScriptEvaluateException if the input format is unknown or evaluation causes an error
   */
  @Throws(JavaScriptEvaluateException::class)
  external fun evaluateScript(script: String): JavaScriptValue

  /**
   * Evaluates given JavaScript source code.
   * @throws JavaScriptEvaluateException if the input format is unknown or evaluation causes an error
   */
  @Throws(JavaScriptEvaluateException::class)
  external fun evaluateVoidScript(script: String)

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

  external fun setNativeStateForSharedObject(id: Int, js: JavaScriptObject)

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
    return runtimeContextHolder.get()?.appContext?.registry?.getModuleHolder(name)?.jsObject
  }

  @Suppress("unused")
  @DoNotStrip
  fun hasModule(name: String): Boolean {
    return runtimeContextHolder.get()?.appContext?.registry?.hasModule(name) ?: false
  }

  /**
   * Returns an array that contains names of available modules.
   */
  @Suppress("unused")
  @DoNotStrip
  fun getJavaScriptModulesName(): Array<String> {
    return runtimeContextHolder.get()?.appContext?.registry?.registry?.keys?.toTypedArray()
      ?: emptyArray()
  }

  @Suppress("unused")
  @DoNotStrip
  fun registerSharedObject(native: Any, js: JavaScriptObject) {
    runtimeContextHolder
      .get()
      ?.sharedObjectRegistry
      ?.add(native as SharedObject, js)
  }

  @Suppress("unused")
  @DoNotStrip
  fun getSharedObject(id: Int): JavaScriptObject? {
    val runtimeContext = runtimeContextHolder.get() ?: return null
    return SharedObjectId(id).toJavaScriptObjectNull(runtimeContext)
  }

  @Suppress("unused")
  @DoNotStrip
  fun deleteSharedObject(id: Int) {
    runtimeContextHolder
      .get()
      ?.sharedObjectRegistry
      ?.delete(SharedObjectId(id))
  }

  @Suppress("unused")
  @DoNotStrip
  fun registerClass(native: Class<*>, js: JavaScriptObject) {
    runtimeContextHolder
      .get()
      ?.classRegistry
      ?.add(native, js)
  }

  @Suppress("unused")
  @DoNotStrip
  fun getJavascriptClass(native: Class<*>): JavaScriptObject? {
    return runtimeContextHolder
      .get()
      ?.classRegistry
      ?.toJavaScriptObject(native)
  }

  @Throws(Throwable::class)
  protected fun finalize() {
    deallocate()
  }

  override fun deallocate() {
    mHybridData.resetNative()
  }

  override fun close() {
    deallocate()
  }
}
