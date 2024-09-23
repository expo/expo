package expo.modules.kotlin.sharedobjects

import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.RuntimeContext
import expo.modules.kotlin.jni.JNIUtils
import expo.modules.kotlin.jni.JavaScriptWeakObject
import expo.modules.kotlin.logger
import expo.modules.kotlin.types.JSTypeConverter
import expo.modules.kotlin.weak

@DoNotStrip
open class SharedObject(runtimeContext: RuntimeContext? = null) {
  constructor(appContext: AppContext) : this(appContext.hostingRuntimeContext)

  /**
   * An identifier of the native shared object that maps to the JavaScript object.
   * When the object is not linked with any JavaScript object, its value is 0.
   */
  internal var sharedObjectId: SharedObjectId = SharedObjectId(0)

  // Used by JNI
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
      .toWeakJavaScriptObject(
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
   * Called when the shared object being deallocated.
   */
  open fun deallocate() {}
}
