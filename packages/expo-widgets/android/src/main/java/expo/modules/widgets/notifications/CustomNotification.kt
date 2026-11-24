package expo.modules.widgets.notifications

import android.content.Context
import expo.modules.kotlin.sharedobjects.SharedObject

internal class CustomNotification(
  private val context: Context,
  val name: String,
  val id: String
) : SharedObject() {
  fun getProps(): Map<String, Any?> {
    val active = CustomNotificationState.find(context, name, id) ?: throw CustomNotificationNotFoundException(name, id)
    return active.props.orEmpty()
  }

  suspend fun update(props: Map<String, Any?>?, overrides: CustomNotificationUpdateOptions) {
    val updated = CustomNotifications.shared.update(context, name, id) { active ->
      active.copy(props = props, options = active.options.merge(overrides))
    }
    if (!updated) {
      throw CustomNotificationNotFoundException(name, id)
    }
  }

  fun cancel() {
    CustomNotifications.shared.cancel(context, name, id)
  }
}
