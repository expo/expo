package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk

import java.util.Arrays

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

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
