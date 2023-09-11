package abi47_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import abi47_0_0.com.facebook.react.ReactPackage
import abi47_0_0.com.facebook.react.bridge.NativeModule
import abi47_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi47_0_0.com.facebook.react.uimanager.ViewManager
import abi47_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.pushprovisioning.AddToWalletButtonManager

class StripeSdkPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf<NativeModule>(StripeSdkModule(reactContext))
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return listOf<ViewManager<*, *>>(
      CardFieldViewManager(),
      AuBECSDebitFormViewManager(),
      StripeContainerManager(),
      CardFormViewManager(),
      AddToWalletButtonManager(reactContext)
    )
  }
}
