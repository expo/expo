package expo.modules.router

import android.content.Context
import android.view.ViewGroup
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

data class ScrollViewDetectedEvent(
  @Field val classification: String,
  @Field val firstChildPath: List<String>,
  @Field val scrollViewPath: List<String>
) : Record

class RouterScrollViewDetectorView(context: Context, appContext: AppContext) :
  ExpoView(context, appContext) {
  private val onScrollViewDetected by EventDispatcher<ScrollViewDetectedEvent>()
  private var lastEvent: ScrollViewDetectedEvent? = null

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    // Wait for the rest of the mounting pass, so the siblings this view inspects already exist.
    post { inspect() }
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    lastEvent = null
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    inspect()
  }

  private fun inspect() {
    val container = parent as? ViewGroup ?: return
    val event = ScrollViewPathInspector.classify(container)?.toEvent() ?: return
    if (event == lastEvent) {
      return
    }
    lastEvent = event
    onScrollViewDetected(event)
  }
}

private fun ScrollViewPathClassification.toEvent() = when (this) {
  ScrollViewPathClassification.FirstChild -> event("first-child")
  ScrollViewPathClassification.NestedNavigator -> event("nested-navigator")
  ScrollViewPathClassification.None -> event("none")
  ScrollViewPathClassification.Ambiguous -> event("ambiguous")
  ScrollViewPathClassification.Embedded -> event("embedded")
  is ScrollViewPathClassification.OffPath -> ScrollViewDetectedEvent(
    classification = "off-path",
    firstChildPath = firstChildPath,
    scrollViewPath = scrollViewPath
  )
}

private fun event(classification: String) = ScrollViewDetectedEvent(
  classification = classification,
  firstChildPath = emptyList(),
  scrollViewPath = emptyList()
)
