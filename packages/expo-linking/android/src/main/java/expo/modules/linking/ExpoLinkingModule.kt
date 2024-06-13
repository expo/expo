package expo.modules.linking

import android.net.Uri
import androidx.core.os.bundleOf
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoLinkingModule : Module() {
  companion object {
    var initialURL: Uri? = null
    var onURLReceived: ((Uri?) -> Unit)? = null
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoLinking")

    Events("onURLReceived")

    Function("getLinkingURL") {
      initialURL?.toString()
    }

    Function("clearLinkingURL") {
      initialURL = null
      return@Function null
    }

    OnStartObserving {
      onURLReceived = {
        this@ExpoLinkingModule.sendEvent("onURLReceived", bundleOf("url" to it?.toString()))
      }
    }

    OnStopObserving {
      onURLReceived = null
    }
  }
}
