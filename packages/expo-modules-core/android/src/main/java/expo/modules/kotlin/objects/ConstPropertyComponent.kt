package expo.modules.kotlin.objects

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptModuleObject

class ConstPropertyComponent<T : Any>(
  val name: String,
  val value: T
) : AnyProperty {
  override fun attachToJSObject(appContext: AppContext, jsObject: JavaScriptModuleObject) {
    jsObject.registerConstProperty(name, value)
  }
}
