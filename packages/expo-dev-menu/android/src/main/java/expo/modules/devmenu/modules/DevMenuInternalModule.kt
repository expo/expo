package expo.modules.devmenu.modules

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.devmenu.DevMenuManager
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.launch

class DevMenuInternalModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoDevMenuInternal")
    Constants(
      "doesDeviceSupportKeyCommands" to EmulatorUtilities.isRunningOnEmulator()
    )

    AsyncFunction("loadFontsAsync") {
      DevMenuManager.loadFonts(context)
    }

    AsyncFunction("dispatchCallableAsync") { callableId: String, args: ReadableMap? ->
      DevMenuManager.dispatchCallable(callableId, args)
    }

    AsyncFunction("hideMenu") {
      DevMenuManager.hideMenu()
    }

    AsyncFunction("closeMenu") {
      DevMenuManager.closeMenu()
    }

    AsyncFunction("setOnboardingFinished") { finished: Boolean ->
      DevMenuManager.getSettings()?.isOnboardingFinished = finished
    }

    AsyncFunction<Unit>("openDevMenuFromReactNative") {
      val instanceManager = DevMenuManager.getReactInstanceManager() ?: return@AsyncFunction
      val devSupportManager = instanceManager.devSupportManager
      val activity = instanceManager.currentReactContext?.currentActivity ?: return@AsyncFunction

      activity.runOnUiThread {
        DevMenuManager.closeMenu()
        devSupportManager.devSupportEnabled = true
        devSupportManager.showDevOptionsDialog()
      }
    }

    AsyncFunction("onScreenChangeAsync") { currentScreen: String? ->
      DevMenuManager.setCurrentScreen(currentScreen)
    }

    AsyncFunction("fetchDataSourceAsync") { id: String, promise: Promise ->
      DevMenuManager.coroutineScope.launch {
        val data = DevMenuManager.fetchDataSource(id)
        val result = Arguments.fromList(data.map { it.serialize() })
        promise.resolve(result)
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
