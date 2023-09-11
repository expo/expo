package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.addresssheet.AddressSheetViewManager

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
        AddressSheetViewManager()
      )
    }
}
