package expo.modules.kotlin.objects

import com.facebook.react.bridge.Arguments
import expo.modules.kotlin.functions.SyncFunctionComponent
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.JNIFunctionBody
import expo.modules.kotlin.jni.JavaScriptModuleObject

class PropertyComponent(
  /**
   * Name of the property.
   */
  val name: String,

  /**
   * Synchronous function that is called when the property is being accessed.
   */
  val getter: SyncFunctionComponent? = null,

  /**
   * Synchronous function that is called when the property is being set.
   */
  val setter: SyncFunctionComponent? = null
) {
  /**
   * Attaches property to the provided js object.
   */
  fun attachToJSObject(jsObject: JavaScriptModuleObject) {
    val jniGetter = if (getter != null) {
      JNIFunctionBody {
        val result = getter.call(emptyArray())
        return@JNIFunctionBody Arguments.fromJavaArgs(arrayOf(result))
      }
    } else {
      null
    }

    val jniSetter = if (setter != null) {
      JNIFunctionBody { args ->
        setter.call(args)
        return@JNIFunctionBody null
      }
    } else {
      null
    }

    jsObject.registerProperty(
      name,
      setter?.getCppRequiredTypes()?.first() ?: CppType.NONE.value,
      jniGetter,
      jniSetter
    )
  }
}
