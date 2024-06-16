package expo.modules.kotlin.sharedobjects

import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.logger
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

  private fun getJavaScriptObject(): JavaScriptObject? {
    return SharedObjectId(sharedObjectId.value)
      .toJavaScriptObject(
        appContext ?: return null
      )
  }

  fun sendEvent(eventName: String, vararg args: Any?) {
    val jsThis = getJavaScriptObject() ?: return

    try {
      jsThis.getProperty("emit")
        .getFunction<Unit?>()
        .invoke(
          eventName,
          *args,
          thisValue = jsThis,
          appContext = appContext
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
