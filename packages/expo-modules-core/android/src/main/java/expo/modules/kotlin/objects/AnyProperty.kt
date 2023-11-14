package expo.modules.kotlin.objects

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptModuleObject

interface AnyProperty {
  fun attachToJSObject(appContext: AppContext, jsObject: JavaScriptModuleObject)
}
