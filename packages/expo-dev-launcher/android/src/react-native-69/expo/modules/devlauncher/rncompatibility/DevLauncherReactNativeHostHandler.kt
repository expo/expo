package expo.modules.devlauncher.rncompatibility

import android.content.Context
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.devsupport.DevSupportManagerFactory
import expo.modules.core.interfaces.ReactNativeHostHandler
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.helpers.getAppJavaScriptExecutorFactory
import java.lang.ref.WeakReference

class DevLauncherReactNativeHostHandler(context: Context) : ReactNativeHostHandler {
  private val contextHolder = WeakReference(context)
  override fun getDevSupportManagerFactory(): DevSupportManagerFactory {
    return DevLauncherDevSupportManagerFactory()
  }

  override fun getUseDeveloperSupport(): Boolean? {
    return if (DevLauncherController.wasInitialized()) DevLauncherController.instance.useDeveloperSupport else null
  }

  override fun getJavaScriptExecutorFactory(): JavaScriptExecutorFactory? {
    val context = contextHolder.get() ?: return null
    val applicationContext = context.applicationContext

    return getAppJavaScriptExecutorFactory(applicationContext)
  }
}
