package expo.modules.brownfield

import androidx.activity.ComponentActivity
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

const val NATIVE_MESSAGE_EVENT_NAME = "onMessage"

class ExpoBrownfieldModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoBrownfieldModule")

    Events(NATIVE_MESSAGE_EVENT_NAME)

    OnStartObserving { BrownfieldMessaging.setExpoModule(this@ExpoBrownfieldModule) }

    OnStopObserving { BrownfieldMessaging.setExpoModule(null) }

    Function("popToNative") { animated: Boolean ->
      appContext.currentActivity?.runOnUiThread {
        val componentActivity = appContext.currentActivity as? ComponentActivity
        if (componentActivity != null) {
          val enabled = BrownfieldNavigationState.nativeBackEnabled
          BrownfieldNavigationState.nativeBackEnabled = true
          componentActivity.onBackPressedDispatcher?.onBackPressed()
          BrownfieldNavigationState.nativeBackEnabled = enabled
        }
      }
    }

    Function("sendMessage") { message: BrownfieldMessage -> BrownfieldMessaging.emit(message) }

    Function("setNativeBackEnabled") { enabled: Boolean ->
      BrownfieldNavigationState.nativeBackEnabled = enabled
    }
  }

  fun sendMessage(message: BrownfieldMessage) {
    sendEvent(NATIVE_MESSAGE_EVENT_NAME, message)
  }
}
