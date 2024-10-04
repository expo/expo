package expo.modules.kotlin.objects

class EventObservingDefinition(
  private val type: Type,
  private val filer: Filter,
  private val body: () -> Unit
) {
  sealed class Filter

  data object AllEventsFilter : Filter()

  class SelectedEventFiler(val event: String) : Filter()

  enum class Type(val value: String) {
    StartObserving("startObserving"),
    StopObserving("stopObserving")
  }

  private fun shouldBeInvoked(eventType: Type, eventName: String): Boolean {
    if (eventType != type) {
      return false
    }

    return when (filer) {
      is AllEventsFilter -> true
      is SelectedEventFiler -> filer.event == eventName
    }
  }

  fun invokedIfNeed(eventType: Type, eventName: String) {
    if (shouldBeInvoked(eventType, eventName)) {
      body()
    }
  }
}
