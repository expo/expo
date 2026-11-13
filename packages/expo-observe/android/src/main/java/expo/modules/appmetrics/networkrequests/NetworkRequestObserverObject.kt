package expo.modules.appmetrics.networkrequests

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject

/** The JS `NetworkRequestObserver` object. It emits each observed request and stops on release. */
internal class NetworkRequestObserverObject(appContext: AppContext, filter: NetworkRequestFilter?) : SharedObject(appContext) {
  val observer = NetworkRequestObserver(filter) { event, payload -> emit(event, payload) }

  override fun sharedObjectDidRelease() {
    observer.stop()
    super.sharedObjectDidRelease()
  }
}
