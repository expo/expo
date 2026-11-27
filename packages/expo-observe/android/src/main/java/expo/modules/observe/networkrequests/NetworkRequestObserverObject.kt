package expo.modules.observe.networkrequests

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.observe.shared.networkrequests.NetworkRequestFilter
import expo.modules.observe.shared.networkrequests.NetworkRequestObserver

/** The JS `NetworkRequestObserver` object. It emits each observed request and stops on release. */
internal class NetworkRequestObserverObject(appContext: AppContext, filter: NetworkRequestFilter?) : SharedObject(appContext) {
  val observer = NetworkRequestObserver(filter) { event, payload -> emit(event, payload) }

  override fun sharedObjectDidRelease() {
    observer.stop()
    super.sharedObjectDidRelease()
  }
}
