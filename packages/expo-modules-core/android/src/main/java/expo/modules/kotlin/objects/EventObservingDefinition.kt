package expo.modules.kotlin.objects

open class EventObservingDefinition(
  private val filer: Filter
) {
  sealed class Filter

  data object AllEventsFilter : Filter()

  class SelectedEventFiler(val event: String) : Filter()

  internal fun shouldBeInvoked(eventName: String): Boolean {
    return when (filer) {
      is AllEventsFilter -> true
      is SelectedEventFiler -> filer.event == eventName
    }
  }
}

class AsyncEventObservingDefinition(
  private val type: Type,
  filer: Filter,
  private val body: () -> Unit
) : EventObservingDefinition(filer) {

  enum class Type(val value: String) {
    StartObserving("startObserving"),
    StopObserving("stopObserving")
  }

  fun invokedIfNeed(eventType: Type, eventName: String) {
    if (eventType == type && shouldBeInvoked(eventName)) {
      body()
    }
  }
}

class SyncEventObservingDefinition<SelfType>(
  private val type: Type,
  private val filer: Filter,
  private val body: (self: SelfType) -> Unit
) : EventObservingDefinition(filer) {
  enum class Type(val value: String) {
    StartObserving("startObservingSync"),
    StopObserving("stopObservingSync")
  }

  fun invokedIfNeed(self: SelfType, eventType: Type, eventName: String) {
    if (eventType == type && shouldBeInvoked(eventName)) {
      body(self)
    }
  }
}
