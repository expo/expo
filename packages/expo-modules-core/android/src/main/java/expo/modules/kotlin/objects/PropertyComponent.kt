package expo.modules.kotlin.objects

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.functions.SyncFunctionComponent
import expo.modules.kotlin.jni.JNIFunctionBody
import expo.modules.kotlin.jni.decorators.JSDecoratorsBridgingObject
import expo.modules.kotlin.types.JSTypeConverter

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
  fun attachToJSObject(appContext: AppContext, jsObject: JSDecoratorsBridgingObject) {
    val jniGetter = if (getter != null) {
      JNIFunctionBody { args ->
        val result = getter.callUserImplementation(args, appContext)
        return@JNIFunctionBody JSTypeConverter.convertToJSValue(result)
      }
    } else {
      null
    }

    val jniSetter = if (setter != null) {
      JNIFunctionBody { args ->
        setter.callUserImplementation(args, appContext)
        return@JNIFunctionBody null
      }
    } else {
      null
    }

    jsObject.registerProperty(
      name,
      getter?.takesOwner == true,
      getter?.getCppRequiredTypes()?.toTypedArray() ?: emptyArray(),
      jniGetter,
      setter?.takesOwner == true,
      setter?.getCppRequiredTypes()?.toTypedArray() ?: emptyArray(),
      jniSetter
    )
  }
}
