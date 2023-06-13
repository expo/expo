package abi47_0_0.com.swmansion.rnscreens

import abi47_0_0.com.facebook.react.ReactPackage
import abi47_0_0.com.facebook.react.bridge.NativeModule
import abi47_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi47_0_0.com.facebook.react.uimanager.ViewManager

class RNScreensPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        emptyList()

    override fun createViewManagers(reactContext: ReactApplicationContext) =
        listOf<ViewManager<*, *>>(
            ScreenContainerViewManager(),
            ScreenViewManager(),
            ScreenStackViewManager(),
            ScreenStackHeaderConfigViewManager(),
            ScreenStackHeaderSubviewManager(),
            SearchBarManager()
        )
}
