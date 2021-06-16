package abi42_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import java.util.Arrays

import abi42_0_0.com.facebook.react.ReactPackage
import abi42_0_0.com.facebook.react.bridge.NativeModule
import abi42_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi42_0_0.com.facebook.react.uimanager.ViewManager

class StripeSdkPackage : ReactPackage {
    lateinit var cardFieldManager: StripeSdkCardViewManager

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        if (!this::cardFieldManager.isInitialized) {
          cardFieldManager = StripeSdkCardViewManager()
        }
        return Arrays.asList<NativeModule>(StripeSdkModule(reactContext, cardFieldManager))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
      if (!this::cardFieldManager.isInitialized) {
        cardFieldManager = StripeSdkCardViewManager()
      }
      return Arrays.asList<ViewManager<*, *>>(cardFieldManager, AuBECSDebitFormViewManager(), StripeContainerManager())
    }
}
