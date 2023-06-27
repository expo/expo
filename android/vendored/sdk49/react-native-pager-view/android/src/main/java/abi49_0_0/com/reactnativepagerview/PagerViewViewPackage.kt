package abi49_0_0.com.reactnativepagerview

import abi49_0_0.com.facebook.react.ReactPackage
import abi49_0_0.com.facebook.react.bridge.NativeModule
import abi49_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi49_0_0.com.facebook.react.uimanager.ViewManager


class PagerViewPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return emptyList()
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return listOf(PagerViewViewManager())
    }
}
