package expo.modules.devmenu.react

import android.app.Application
import com.facebook.hermes.reactexecutor.HermesExecutorFactory
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.jscexecutor.JSCExecutorFactory
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers
import com.facebook.soloader.SoLoader

fun createNonDebuggableJavaScriptExecutorFactory(application: Application): JavaScriptExecutorFactory {
  SoLoader.init(application.applicationContext, /* native exopackage */ false)
  if (SoLoader.getLibraryPath("libjsc.so") != null) {
    return JSCExecutorFactory(application.packageName, AndroidInfoHelpers.getFriendlyDeviceName())
  }
  return HermesExecutorFactory().also {
    try {
      HermesExecutorFactory::class.java
        .getMethod("setEnableDebugger", Boolean::class.java)
        .invoke(it, false)
    } catch (_: Throwable) {
    }
  }
}
