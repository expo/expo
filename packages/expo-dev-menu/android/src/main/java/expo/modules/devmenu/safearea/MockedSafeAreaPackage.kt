package expo.modules.devmenu.safearea

import android.view.ViewGroup
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.views.view.ReactViewGroup

// React navigation uses a safe area provider, but we don't need this.
// So we can just mock it.
class MockedSafeAreaPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext) = mutableListOf<NativeModule>()

  override fun createViewManagers(reactContext: ReactApplicationContext): MutableList<ViewGroupManager<ViewGroup>> {
    return mutableListOf(
      object : ViewGroupManager<ViewGroup>() {
        override fun createViewInstance(reactContext: ThemedReactContext) = ReactViewGroup(reactContext)

        override fun getName() = "RNCSafeAreaProvider"
      }
    )
  }
}
