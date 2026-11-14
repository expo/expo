package expo.modules.notifications.notifications.categories

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Required
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.notifications.notifications.model.NotificationAction
import expo.modules.notifications.notifications.model.NotificationCategory
import expo.modules.notifications.notifications.model.TextInputNotificationAction
import kotlinx.serialization.Required as SerializationRequired
import kotlinx.serialization.Serializable

@OptimizedRecord
@Serializable
data class NotificationActionRecord(
  @Field @Required @SerializationRequired val identifier: String = "",
  @Field @Required @SerializationRequired val buttonTitle: String = "",
  @Field val textInput: TextInput? = null,
  @Field val options: Options = Options()
) : Record {
  @OptimizedRecord
  @Serializable
  data class TextInput(
    @Field @Required @SerializationRequired val placeholder: String = ""
  ) : Record

  @OptimizedRecord
  @Serializable
  data class Options(
    @Field val opensAppToForeground: Boolean = true
  ) : Record

  fun toNotificationAction(): NotificationAction = textInput?.let {
    TextInputNotificationAction(identifier, buttonTitle, options.opensAppToForeground, it.placeholder)
  } ?: NotificationAction(identifier, buttonTitle, options.opensAppToForeground)

  companion object {
    fun fromLegacy(action: NotificationAction) = NotificationActionRecord(
      identifier = action.identifier,
      buttonTitle = action.title,
      textInput = (action as? TextInputNotificationAction)?.let { TextInput(it.placeholder) },
      options = Options(action.opensAppToForeground())
    )
  }
}

@OptimizedRecord
@Serializable
data class NotificationCategoryRecord(
  @Field @Required @SerializationRequired val identifier: String = "",
  @Field @Required @SerializationRequired val actions: List<NotificationActionRecord> = emptyList()
) : Record {
  companion object {
    fun fromLegacy(category: NotificationCategory) = NotificationCategoryRecord(
      category.identifier,
      category.actions.map(NotificationActionRecord::fromLegacy)
    )
  }
}
