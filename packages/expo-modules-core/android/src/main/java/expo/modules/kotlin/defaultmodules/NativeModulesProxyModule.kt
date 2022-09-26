package expo.modules.kotlin.defaultmodules

import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.KPromiseWrapper
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

internal const val NativeModulesProxyModuleName = "NativeModulesProxy"

class NativeModulesProxyModule : Module() {
  override fun definition() = ModuleDefinition {
    Name(NativeModulesProxyModuleName)

    Constants {
      appContext.legacyModulesProxyHolder?.get()?.constants ?: emptyMap()
    }

    AsyncFunction("callMethod") { moduleName: String, methodName: String, arguments: ReadableArray, promise: Promise ->
      val kPromise = promise as KPromiseWrapper
      val bridgePromise = kPromise.bridgePromise
      val legacyModulesProxyHolder = appContext.legacyModulesProxyHolder?.get()
        ?: throw UnexpectedException("The legacy modules proxy holder has been lost")
      legacyModulesProxyHolder.callMethod(moduleName, methodName, arguments, bridgePromise)
    }
  }
}
