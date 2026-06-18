package expo.modules.widgets

internal const val ON_USER_INTERACTION = "onExpoWidgetsUserInteraction"

private const val EVENT_TYPE_USER_INTERACTION = "ExpoWidgetsUserInteraction"

internal object WidgetsEvents {
  private var userInteractionObserver: ((Map<String, Any?>) -> Unit)? = null

  @Synchronized
  fun startObservingUserInteractions(observer: (Map<String, Any?>) -> Unit) {
    userInteractionObserver = observer
  }

  @Synchronized
  fun stopObservingUserInteractions() {
    userInteractionObserver = null
  }

  @Synchronized
  fun sendUserInteraction(source: String, target: String) {
    userInteractionObserver?.invoke(userInteractionEvent(source, target))
  }

  private fun userInteractionEvent(source: String, target: String): Map<String, Any?> {
    return mapOf(
      "source" to source,
      "target" to target,
      "timestamp" to System.currentTimeMillis(),
      "type" to EVENT_TYPE_USER_INTERACTION
    )
  }
}
