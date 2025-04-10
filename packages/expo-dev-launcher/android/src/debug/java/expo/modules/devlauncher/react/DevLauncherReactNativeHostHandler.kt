package expo.modules.devlauncher.react

import android.content.Context
import com.facebook.hermes.reactexecutor.HermesExecutorFactory
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.devsupport.DevSupportManagerFactory
import com.facebook.react.jscexecutor.JSCExecutorFactory
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers
import com.facebook.soloader.SoLoader
import expo.modules.core.interfaces.ReactNativeHostHandler
import expo.modules.devlauncher.DevLauncherController
import java.lang.ref.WeakReference
import expo.modules.updatesinterface.UpdatesControllerRegistry
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class DevLauncherReactNativeHostHandler(context: Context) : ReactNativeHostHandler {
  private val contextHolder = WeakReference(context)
  override fun getDevSupportManagerFactory(): DevSupportManagerFactory? {
    return DevLauncherDevSupportManagerFactory()
  }

  override fun getUseDeveloperSupport(): Boolean? {
    return if (DevLauncherController.wasInitialized()) DevLauncherController.instance.useDeveloperSupport else null
  }

  override fun getJavaScriptExecutorFactory(): JavaScriptExecutorFactory? {
    val context = contextHolder.get() ?: return null
    val applicationContext = context.applicationContext

    SoLoader.init(applicationContext, /* native exopackage */ false)
    if (SoLoader.getLibraryPath("libv8android.so") != null) {
      // Assuming V8 overrides the `getJavaScriptExecutorFactory` in the main ReactNativeHost,
      // return null here to use the default value.
      return null
    }
    if (SoLoader.getLibraryPath("libjsc.so") != null) {
      return JSCExecutorFactory(applicationContext.packageName, AndroidInfoHelpers.getFriendlyDeviceName())
    }
    return HermesExecutorFactory()
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
        it.updatesInterfaceCallbacks = WeakReference(DevLauncherController.instance)
      }
    }
  }
}
