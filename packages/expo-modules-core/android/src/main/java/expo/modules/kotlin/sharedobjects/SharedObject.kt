package expo.modules.kotlin.sharedobjects

import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JNIUtils
import expo.modules.kotlin.jni.JavaScriptWeakObject
import expo.modules.kotlin.logger
import expo.modules.kotlin.types.JSTypeConverter
import java.lang.ref.WeakReference

@DoNotStrip
open class SharedObject(appContext: AppContext? = null) {
  /**
   * An identifier of the native shared object that maps to the JavaScript object.
   * When the object is not linked with any JavaScript object, its value is 0.
   */
  internal var sharedObjectId: SharedObjectId = SharedObjectId(0)

  internal var appContextHolder = WeakReference<AppContext>(appContext)

  val appContext: AppContext?
    get() = appContextHolder.get()

  private fun getJavaScriptObject(): JavaScriptWeakObject? {
    return SharedObjectId(sharedObjectId.value)
      .toWeakJavaScriptObject(
        appContext ?: return null
      )
  }

  fun emit(eventName: String, vararg args: Any?) {
    val jsObject = getJavaScriptObject() ?: return
    val jniInterop = appContextHolder.get()?.jsiInterop ?: return
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

  /**
   * Called when the shared object being deallocated.
   */
  open fun deallocate() {}
}
