package expo.modules.updates

import expo.modules.updatesinterface.UpdatesStateChangeSubscription

class DisabledUpdatesStateChangeSubscription : UpdatesStateChangeSubscription {
  override fun remove() {}
  override fun getContext(): Any? = null
}

class EnabledUpdatesStateChangeSubscription(val subscriptionId: String) : UpdatesStateChangeSubscription {
  override fun remove() {
    val updatesController: EnabledUpdatesController? = UpdatesController.instance as? EnabledUpdatesController
    updatesController?.unsubscribeFromUpdatesStateChanges(subscriptionId)
  }

  override fun getContext(): Any? {
    val updatesController: EnabledUpdatesController? = UpdatesController.instance as? EnabledUpdatesController
    return updatesController?.getNativeInterfaceContext()
  }
}
