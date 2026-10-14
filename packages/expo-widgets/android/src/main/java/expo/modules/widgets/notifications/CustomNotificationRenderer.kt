package expo.modules.widgets.notifications

import android.content.Context
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import expo.modules.widgets.InteractionSource
import expo.modules.widgets.WidgetsStorage
import expo.modules.widgets.evaluateLayout
import expo.modules.widgets.getWidgetEnvironment
import expo.modules.widgets.toPeekRoot
import io.github.jakex7.peek.emittables.peekEmittableNotificationViews
import io.github.jakex7.peek.notification.PeekNotificationSizes
import io.github.jakex7.peek.notification.PeekNotificationViews

internal object CustomNotificationRenderer {
  suspend fun render(context: Context, state: CustomNotificationState): PeekNotificationViews {
    val (name, id, props) = state
    val layout = WidgetsStorage.getString(context, "__expo_widgets_notification_${name}_layout")
      ?.takeIf { it.isNotEmpty() }
      ?: throw CustomNotificationLayoutNotFoundException(name)
    val sections = evaluateLayout(context, layout, props, getWidgetEnvironment(context))
    val sizes = PeekNotificationSizes()
    val source = InteractionSource.Notification(name, id)

    val collapsedRoot = sections.section("collapsed")?.toPeekRoot(context, source, sizes.collapsed)
      // A bare element instead of a section map, for example the error node from a failed evaluation.
      ?: sections.takeIf { it.hasKey("type") }?.toPeekRoot(context, source, sizes.collapsed)
      ?: throw MissingCollapsedSectionException(name)
    val expandedRoot = sections.section("expanded")?.toPeekRoot(context, source, sizes.expanded)
    val headsUpRoot = sections.section("headsUp")?.toPeekRoot(context, source, sizes.headsUp)

    return peekEmittableNotificationViews(
      context = context,
      collapsed = collapsedRoot,
      expanded = expandedRoot,
      headsUp = headsUpRoot,
      sizes = sizes
    )
  }

  private fun ReadableMap.section(key: String): ReadableMap? {
    return if (hasKey(key) && !isNull(key) && getType(key) == ReadableType.Map) getMap(key) else null
  }
}
