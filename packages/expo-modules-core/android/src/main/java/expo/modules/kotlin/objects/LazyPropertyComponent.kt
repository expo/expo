package expo.modules.kotlin.objects

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JNINoArgsFunctionBody
import expo.modules.kotlin.jni.decorators.JSDecoratorsBridgingObject
import expo.modules.kotlin.types.JSTypeConverter

class LazyPropertyComponent(
  /**
   * Name of the property.
   */
  val name: String,

  /**
   * Synchronous function that is called when the property is being accessed for the first time.
   */
  val getter: (() -> Any?)? = null
) {
  /**
   * Attaches property to the provided js object.
   */
  fun attachToJSObject(jsObject: JSDecoratorsBridgingObject) {
    val jniGetter = if (getter != null) {
      JNINoArgsFunctionBody {
        val result = getter.invoke()
        return@JNINoArgsFunctionBody JSTypeConverter.convertToJSValue(result)
      }
    } else {
      null
    }

    jsObject.registerLazyProperty(name, jniGetter)
  }
}
