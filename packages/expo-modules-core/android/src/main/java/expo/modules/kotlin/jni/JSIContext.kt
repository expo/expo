package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import com.facebook.react.bridge.RuntimeExecutor
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import com.facebook.soloader.SoLoader
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.RuntimeContext
import expo.modules.kotlin.exception.JavaScriptEvaluateException
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.sharedobjects.SharedObjectId
import expo.modules.kotlin.weak
import java.lang.ref.WeakReference

/**
 * Despite the fact that this class is marked as [Destructible], it is not included in the [JNIDeallocator].
 * The deallocation of the [JSIContext] should be performed at the very end
 * to prevent the destructor of the [Destructible] object from accessing data that has already been freed.
 */
@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class JSIContext : Destructible, AutoCloseable {
  lateinit var runtimeContextHolder: WeakReference<RuntimeContext>

  // Has to be called "mHybridData" - fbjni uses it via reflection
  @DoNotStrip
  private val mHybridData = initHybrid()

  private external fun initHybrid(): HybridData

  @OptIn(FrameworkAPI::class)
  fun installJSI(
    runtimeContext: RuntimeContext,
    jsRuntimePointer: Long,
    jsInvokerHolder: CallInvokerHolderImpl
  ) {
    runtimeContextHolder = runtimeContext.weak()
    installJSI(
      jsRuntimePointer,
      runtimeContext.jniDeallocator,
      jsInvokerHolder
    )
  }

  fun installJSIForBridgeless(
    runtimeContext: RuntimeContext,
    jsRuntimePointer: Long,
    runtimeExecutor: RuntimeExecutor
  ) {
    runtimeContextHolder = runtimeContext.weak()
    installJSIForBridgeless(
      jsRuntimePointer,
      runtimeContext.jniDeallocator,
      runtimeExecutor
    )
  }

  /**
   * Initializes the `ExpoModulesHostObject` and adds it to the global object.
   */
  @OptIn(FrameworkAPI::class)
  private external fun installJSI(
    jsRuntimePointer: Long,
    jniDeallocator: JNIDeallocator,
    jsInvokerHolder: CallInvokerHolderImpl
  )

  private external fun installJSIForBridgeless(
    jsRuntimePointer: Long,
    jniDeallocator: JNIDeallocator,
    runtimeExecutor: RuntimeExecutor
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
    return runtimeContextHolder.get()?.registry?.getModuleHolder(name)?.jsObject
  }

  @Suppress("unused")
  @DoNotStrip
  fun hasModule(name: String): Boolean {
    return runtimeContextHolder.get()?.registry?.hasModule(name) ?: false
  }

  /**
   * Returns an array that contains names of available modules.
   */
  @Suppress("unused")
  @DoNotStrip
  fun getJavaScriptModulesName(): Array<String> {
    return runtimeContextHolder.get()?.registry?.registry?.keys?.toTypedArray() ?: emptyArray()
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

  @Suppress("unused")
  @DoNotStrip
  fun getCoreModuleObject(): JavaScriptModuleObject? {
    return runtimeContextHolder.get()?.coreModule?.jsObject
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

  override fun close() {
    deallocate()
  }
}
