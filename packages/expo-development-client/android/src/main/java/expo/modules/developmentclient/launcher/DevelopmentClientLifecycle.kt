package expo.modules.developmentclient.launcher

import com.facebook.react.ReactActivity
import java.util.*

typealias DevelopmentClientDelegateWillBeCreated = (ReactActivity) -> Unit

/**
 * This class encapsulate all lifecycle methods related to the DevelopmentClient instance and loaded apps.
 */
class DevelopmentClientLifecycle {
  private val delegateWillBeCreatedListeners = LinkedList<DevelopmentClientDelegateWillBeCreated>()

  fun delegateWillBeCreated(activity: ReactActivity) {
    delegateWillBeCreatedListeners.forEach {
      it.invoke(activity)
    }
  }

  fun addListener(listener: DevelopmentClientDelegateWillBeCreated) {
    delegateWillBeCreatedListeners.add(listener)
  }

  fun removeListener(listener: DevelopmentClientDelegateWillBeCreated) {
    delegateWillBeCreatedListeners.remove(listener)
  }
}
