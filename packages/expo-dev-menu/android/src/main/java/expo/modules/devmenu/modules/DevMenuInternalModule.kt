package expo.modules.devmenu.modules

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.devmenu.DevMenuManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DevMenuInternalModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoDevMenuInternal")
    Constants(
      "doesDeviceSupportKeyCommands" to EmulatorUtilities.isRunningOnEmulator()
    )

    AsyncFunction<Unit>("loadFontsAsync") {
      DevMenuManager.loadFonts(context)
    }

    AsyncFunction("reload", DevMenuManager::reload)
    AsyncFunction("togglePerformanceMonitor", DevMenuManager::togglePerformanceMonitor)
    AsyncFunction("toggleInspector", DevMenuManager::toggleInspector)
    AsyncFunction("openJSInspector", DevMenuManager::openJSInspector)
    AsyncFunction("toggleFastRefresh", DevMenuManager::toggleFastRefresh)

    AsyncFunction<Unit>("hideMenu") {
      DevMenuManager.hideMenu()
    }

    AsyncFunction<Unit>("closeMenu") {
      DevMenuManager.closeMenu()
    }

    AsyncFunction("setOnboardingFinished") { finished: Boolean ->
      DevMenuManager.getSettings()?.isOnboardingFinished = finished
    }

    AsyncFunction<Unit>("openDevMenuFromReactNative") {
      val devSupportManager = DevMenuManager.getReactHost()?.devSupportManager
        ?: return@AsyncFunction
      val activity = DevMenuManager.getReactHost()?.currentReactContext?.currentActivity
        ?: return@AsyncFunction

      activity.runOnUiThread {
        DevMenuManager.closeMenu()
        devSupportManager.devSupportEnabled = true
        devSupportManager.showDevOptionsDialog()
      }
    }

    AsyncFunction("copyToClipboardAsync") { content: String ->
      val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
      val clip = ClipData.newPlainText(null, content)
      clipboard.setPrimaryClip(clip)
    }

    AsyncFunction("fireCallback") { name: String ->
      val callback = DevMenuManager.registeredCallbacks.firstOrNull { it.name == name }
        ?: throw UnexpectedException("Callback with name: $name is not registered")

      DevMenuManager.sendEventToDelegateBridge("registeredCallbackFired", name)
      if (callback.shouldCollapse) {
        DevMenuManager.closeMenu()
      }
    }
  }
}
