package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.exception.JavaScriptEvaluateException
import expo.modules.kotlin.jni.decorators.JSDecoratorsBridgingObject
import expo.modules.kotlin.runtime.Runtime
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
  val runtimeHolder: WeakReference<Runtime>
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
   * Schedules a block to run on the JS thread via the RuntimeScheduler.
   */
  external fun scheduleOnJSThread(runnable: Runnable)

  /**
   * Drains the JavaScript VM internal Microtask (a.k.a. event loop) queue.
   */
  external fun drainJSEventLoop()

  external fun setNativeStateForSharedObject(id: Int, js: JavaScriptObject)

  /**
   * Installs `SharedObject.__resolveInWorklet` in this runtime.
   */
  external fun installModuleClasses()

  /**
   * Called from C++ `__resolveInWorklet`, returns the Java class of a SharedObject by its ID.
   */
  @Suppress("unused")
  @DoNotStrip
  fun getNativeSharedObjectClass(objectId: Int): Class<*>? {
    val appContext = runtimeHolder.get()?.appContext ?: return null
    val mainRegistry = appContext.runtime.sharedObjectRegistry
    val nativeObject = mainRegistry.toNativeObjectOrNull(SharedObjectId(objectId))
    return nativeObject?.javaClass
  }

  /**
   * Exports a single SharedObject class to this runtime.
   */
  @Suppress("unused")
  @DoNotStrip
  fun buildClassDecorator(nativeClass: Class<*>): JSDecoratorsBridgingObject? {
    val runtime = runtimeHolder.get() ?: return null
    val appContext = runtime.appContext ?: return null

    val classDefinition = appContext.registry
      .asSequence()
      .flatMap { it.definition.classData }
      .firstOrNull { it.constructor.ownerType?.jClass == nativeClass }
      ?: return null

    val decorator = JSDecoratorsBridgingObject(runtime.deallocator)
    with(decorator) {
      classDefinition.exportClass(appContext, runtime)
    }
    return decorator
  }

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
    return runtimeHolder.get()?.appContext?.registry?.getModuleHolder(name)?.jsObject
  }

  @Suppress("unused")
  @DoNotStrip
  fun hasModule(name: String): Boolean {
    return runtimeHolder.get()?.appContext?.registry?.hasModule(name) ?: false
  }

  /**
   * Returns an array that contains names of available modules.
   */
  @Suppress("unused")
  @DoNotStrip
  fun getJavaScriptModulesName(): Array<String> {
    return runtimeHolder.get()?.appContext?.registry?.registry?.keys?.toTypedArray()
      ?: emptyArray()
  }

  @Suppress("unused")
  @DoNotStrip
  fun registerSharedObject(native: Any, js: JavaScriptObject) {
    runtimeHolder
      .get()
      ?.sharedObjectRegistry
      ?.add(native as SharedObject, js)
  }

  @Suppress("unused")
  @DoNotStrip
  fun getSharedObject(id: Int): JavaScriptObject? {
    val runtimeContext = runtimeHolder.get() ?: return null
    return SharedObjectId(id).toJavaScriptObjectNull(runtimeContext)
  }

  @Suppress("unused")
  @DoNotStrip
  fun deleteSharedObject(id: Int) {
    runtimeHolder
      .get()
      ?.sharedObjectRegistry
      ?.delete(SharedObjectId(id))
  }

  @Suppress("unused")
  @DoNotStrip
  fun registerClass(native: Class<*>, js: JavaScriptObject) {
    runtimeHolder
      .get()
      ?.classRegistry
      ?.add(native, js)
  }

  @Suppress("unused")
  @DoNotStrip
  fun getJavascriptClass(native: Class<*>): JavaScriptObject? {
    return runtimeHolder
      .get()
      ?.classRegistry
      ?.toJavaScriptObject(native)
  }

  @Throws(Throwable::class)
  protected fun finalize() {
    close()
  }

  override fun close() {
    mHybridData.resetNative()
  }

  override fun getHybridDataForJNIDeallocator(): HybridData {
    return mHybridData
  }
}
