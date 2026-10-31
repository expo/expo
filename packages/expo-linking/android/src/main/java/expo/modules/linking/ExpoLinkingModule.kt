package expo.modules.linking

import android.net.Uri
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.Record
import java.lang.ref.WeakReference

@Record
internal data class URLReceivedEvent(val url: String?)

@ExpoModule("ExpoLinking")
class ExpoLinkingModule : Module() {
  companion object {
    var initialURL: Uri? = null
    var onURLReceivedObservers: MutableSet<((Uri?) -> Unit)> = mutableSetOf()
  }

  private var onURLReceivedObserver: ((Uri?) -> Unit)? = null

  @Event(name = "onURLReceived")
  private val onURLReceived = event<URLReceivedEvent>(
    onStartObserving = ::startObservingURLs,
    onStopObserving = ::stopObservingURLs
  )

  @JS
  fun getLinkingURL(): String? {
    return initialURL?.toString()
  }

  @JS
  fun clearInitialURL() {
    initialURL = null
  }

  private fun startObservingURLs() {
    val weakModule = WeakReference(this@ExpoLinkingModule)
    val observer: (Uri?) -> Unit = { uri: Uri? ->
      weakModule.get()?.onURLReceived?.invoke(URLReceivedEvent(uri?.toString()))
    }
    onURLReceivedObservers.add(observer)
    onURLReceivedObserver = observer
  }

  private fun stopObservingURLs() {
    onURLReceivedObservers.remove(onURLReceivedObserver)
  }
}
