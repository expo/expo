package expo.modules.updates

import expo.modules.updatesinterface.UpdatesStateChangeSubscription

class DisabledUpdatesStateChangeSubscription : UpdatesStateChangeSubscription {
  override fun remove() {}
}

class EnabledUpdatesStateChangeSubscription(val subscriptionId: String) : UpdatesStateChangeSubscription {
  override fun remove() {
    val updatesController: EnabledUpdatesController? = UpdatesController.instance as EnabledUpdatesController
    updatesController?.unsubscribeFromUpdatesStateChanges(subscriptionId)
  }
}
