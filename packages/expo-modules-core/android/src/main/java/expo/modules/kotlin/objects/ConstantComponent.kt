package expo.modules.kotlin.objects

import expo.modules.kotlin.jni.JNINoArgsFunctionBody
import expo.modules.kotlin.jni.decorators.JSDecoratorsBridgingObject
import expo.modules.kotlin.types.JSTypeConverter

class ConstantComponent(
  /**
   * Name of the constant.
   */
  val name: String,

  /**
   * Synchronous function that is called when the constant is being accessed for the first time.
   */
  val getter: () -> Any?
) {
  /**
   * Attaches constant to the provided js object.
   */
  fun attachToJSObject(jsObject: JSDecoratorsBridgingObject) {
    val jniGetter = JNINoArgsFunctionBody {
      val result = getter.invoke()
      return@JNINoArgsFunctionBody JSTypeConverter.convertToJSValue(result)
    }

    jsObject.registerConstant(name, jniGetter)
  }
}
