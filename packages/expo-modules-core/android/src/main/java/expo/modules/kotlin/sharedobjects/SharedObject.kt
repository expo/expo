package expo.modules.kotlin.sharedobjects

import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.RuntimeContext
import expo.modules.kotlin.jni.JNIUtils
import expo.modules.kotlin.jni.JavaScriptWeakObject
import expo.modules.kotlin.logger
import expo.modules.kotlin.types.JSTypeConverter
import expo.modules.kotlin.weak
import kotlin.reflect.KClass

@DoNotStrip
open class SharedObject(runtimeContext: RuntimeContext? = null) {
  constructor(appContext: AppContext) : this(appContext.hostingRuntimeContext)

  /**
   * An identifier of the native shared object that maps to the JavaScript object.
   * When the object is not linked with any JavaScript object, its value is 0.
   */
  internal var sharedObjectId: SharedObjectId = SharedObjectId(0)

  // Used by JNI
  @DoNotStrip
  private fun getSharedObjectId(): Int {
    return sharedObjectId.value
  }

  var runtimeContextHolder = runtimeContext.weak()

  private val runtimeContext: RuntimeContext?
    get() = runtimeContextHolder.get()

  val appContext
    get() = runtimeContext?.appContext

  private fun getJavaScriptObject(): JavaScriptWeakObject? {
    return SharedObjectId(sharedObjectId.value)
      .toWeakJavaScriptObjectNull(
        runtimeContext ?: return null
      )
  }

  fun emit(eventName: String, vararg args: Any?) {
    val jsObject = getJavaScriptObject() ?: return
    val jniInterop = runtimeContext?.jsiContext ?: return
    try {
      JNIUtils.emitEvent(
        jsObject,
        jniInterop,
        eventName,
        args
          .map { JSTypeConverter.convertToJSValue(it) }
          .toTypedArray()
      )
    } catch (e: Throwable) {
      logger.error("Unable to send event '$eventName' by shared object of type ${this::class.java.simpleName}", e)
    }
  }

  open fun onStartListeningToEvent(eventName: String) = Unit

  open fun onStopListeningToEvent(eventName: String) = Unit

  /**
   * Called when the shared object was released.
   */
  @Suppress("DEPRECATION")
  open fun sharedObjectDidRelease() = deallocate()

  /**
   * Called when the shared object being deallocated.
   */
  @Deprecated("Use sharedObjectDidRelease() instead.", ReplaceWith("sharedObjectDidRelease()"))
  open fun deallocate() = Unit

  /**
   * Override this function to inform the JavaScript runtime that there is additional
   * memory associated with a given JavaScript object that is not visible to the GC.
   * This can be used if an object is known to exclusively retain some native memory,
   * and may be used to guide decisions about when to run garbage collection.
   */
  open fun getAdditionalMemoryPressure(): Int {
    return 0
  }
}

fun KClass<*>.isSharedObjectClass() =
  SharedObject::class.java.isAssignableFrom(this.java)
