package abi48_0_0.expo.modules.kotlin.defaultmodules

import abi48_0_0.com.facebook.react.bridge.ReadableArray
import abi48_0_0.expo.modules.kotlin.Promise
import abi48_0_0.expo.modules.kotlin.exception.UnexpectedException
import abi48_0_0.expo.modules.kotlin.modules.Module
import abi48_0_0.expo.modules.kotlin.modules.ModuleDefinition
import abi48_0_0.expo.modules.kotlin.toBridgePromise

internal const val NativeModulesProxyModuleName = "NativeModulesProxy"

class NativeModulesProxyModule : Module() {
  override fun definition() = ModuleDefinition {
    Name(NativeModulesProxyModuleName)

    Constants {
      appContext.legacyModulesProxyHolder?.get()?.constants ?: emptyMap()
    }

    AsyncFunction("callMethod") { moduleName: String, methodName: String, arguments: ReadableArray, promise: Promise ->
      val bridgePromise = promise.toBridgePromise()
      val legacyModulesProxyHolder = appContext.legacyModulesProxyHolder?.get()
        ?: throw UnexpectedException("The legacy modules proxy holder has been lost")
      legacyModulesProxyHolder.callMethod(moduleName, methodName, arguments, bridgePromise)
    }
  }
}
