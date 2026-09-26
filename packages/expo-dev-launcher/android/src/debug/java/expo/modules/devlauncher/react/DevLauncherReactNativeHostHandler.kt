package expo.modules.devlauncher.react

import android.content.Context
import com.facebook.hermes.reactexecutor.HermesExecutorFactory
import com.facebook.react.ReactHost
import com.facebook.react.devsupport.DevMenuConfiguration
import com.facebook.react.devsupport.DevSupportManagerFactory
import expo.modules.core.interfaces.ReactNativeHostHandler
import expo.modules.devlauncher.DevLauncherController
import java.lang.ref.WeakReference
import expo.modules.updatesinterface.UpdatesControllerRegistry
import expo.modules.updatesinterface.UpdatesDevLauncherInterface
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class DevLauncherReactNativeHostHandler : ReactNativeHostHandler {
  override fun getDevSupportManagerFactory(): DevSupportManagerFactory {
    return DevLauncherDevSupportManagerFactory()
  }

  override fun getUseDeveloperSupport(): Boolean? {
    return if (DevLauncherController.wasInitialized()) DevLauncherController.instance.useDeveloperSupport else null
  }

  override fun getJavaScriptExecutorFactory() = HermesExecutorFactory()

  override fun onDidCreateReactHost(context: Context, reactNativeHost: ReactHost) {
    reactNativeHost.setDevMenuConfiguration(
      DevMenuConfiguration(
        devMenuEnabled = true,
        shakeGestureEnabled = false,
        keyboardShortcutsEnabled = true
      )
    )
  }

  override fun onWillCreateReactInstance(useDeveloperSupport: Boolean) {
    super.onWillCreateReactInstance(useDeveloperSupport)
    // On New Architecture mode, `onWillCreateReactInstance()` would be called
    // inside `DevLauncherController.initialize()`.
    // The `DevLauncherController.instance` is not available at this point.
    // Posting the updates interface setup to next run loop.
    CoroutineScope(Dispatchers.Main).launch {
      UpdatesControllerRegistry.controller?.get()?.let {
        DevLauncherController.instance.updatesInterface = it
        (it as UpdatesDevLauncherInterface).updatesInterfaceCallbacks = WeakReference(DevLauncherController.instance)
      }
    }
  }
}
