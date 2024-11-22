package expo.modules.kotlin.objects

class EventObservingDefinition(
  private val type: Type,
  private val filer: Filter,
  private val body: () -> Unit
) {
  enum class Type(val value: String) {
    StartObserving("startObserving"),
    StopObserving("stopObserving")
  }

  sealed class Filter

  data object AllEventsFilter : Filter()

  class SelectedEventFiler(val event: String) : Filter()

  internal fun shouldBeInvoked(eventName: String): Boolean {
    return when (filer) {
      is AllEventsFilter -> true
      is SelectedEventFiler -> filer.event == eventName
    }
  }

  fun invokedIfNeed(eventType: Type, eventName: String) {
    if (eventType == type && shouldBeInvoked(eventName)) {
      body()
    }
  }
}
