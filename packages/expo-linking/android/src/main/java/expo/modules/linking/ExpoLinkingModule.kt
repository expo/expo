package expo.modules.linking

import android.net.Uri
import androidx.core.os.bundleOf
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoLinkingModule : Module() {
  companion object {
    var initialURL: Uri? = null
    var onURLReceivedObservers: MutableSet<((Uri?) -> Unit)> = mutableSetOf()
  }

  private var onURLReceivedObserver: ((Uri?) -> Unit)? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoLinking")

    Events("onURLReceived")

    Function("getLinkingURL") {
      initialURL?.toString()
    }

    Function<Unit>("clearLinkingURL") {
      initialURL = null
    }

    OnStartObserving("onURLReceived") {
      val observer = { uri: Uri? ->
        this@ExpoLinkingModule.sendEvent("onURLReceived", bundleOf("url" to uri?.toString()))
      }
      onURLReceivedObservers.add(observer)
      onURLReceivedObserver = observer
    }

    OnStopObserving("onURLReceived") {
      onURLReceivedObservers.remove(onURLReceivedObserver)
    }
  }
}
