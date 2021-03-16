package abi40_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import java.util.Arrays

import abi40_0_0.com.facebook.react.ReactPackage
import abi40_0_0.com.facebook.react.bridge.NativeModule
import abi40_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi40_0_0.com.facebook.react.uimanager.ViewManager

class StripeSdkPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return Arrays.asList<NativeModule>(StripeSdkModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return Arrays.asList<ViewManager<*, *>>(StripeSdkCardViewManager())
    }
}
