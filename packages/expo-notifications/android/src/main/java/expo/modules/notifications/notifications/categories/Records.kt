package expo.modules.notifications.notifications.categories

import android.os.Bundle
import android.os.Parcelable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Required
import expo.modules.notifications.notifications.model.NotificationAction
import expo.modules.notifications.notifications.model.TextInputNotificationAction
import kotlinx.parcelize.Parcelize
import kotlinx.serialization.Serializable

@Parcelize
@Serializable
data class NotificationActionRecord(
  @Field
  @Required
  val identifier: String = "",

  @Field
  @Required
  val buttonTitle: String = "",

  @Field
  val textInput: TextInput? = null,

  @Field
  val options: Options = Options()
) : Record, Parcelable {
  @Parcelize
  @Serializable
  data class TextInput(
    @Field
    @Required
    val placeholder: String = ""
  ) : Record, Parcelable

  @Parcelize
  @Serializable
  data class Options(
    @Field
    val opensAppToForeground: Boolean = true
  ) : Record, Parcelable

  companion object {
    /**
     * Converts a legacy [NotificationAction] to a [NotificationActionRecord].
     */
    fun fromLegacy(action: NotificationAction): NotificationActionRecord {
      val textInput = if (action is TextInputNotificationAction) {
        TextInput(action.placeholder)
      } else {
        null
      }
      return NotificationActionRecord(
        identifier = action.identifier,
        buttonTitle = action.title,
        textInput = textInput,
        options = Options(action.opensAppToForeground())
      )
    }

    /**
     * Reads a [NotificationActionRecord] from a [Bundle] extra, handling both the new
     * [NotificationActionRecord] format and the legacy [NotificationAction] format
     * (from PendingIntents created before the migration).
     */
    fun fromParcelableExtra(extras: Bundle?, key: String): NotificationActionRecord? {
      val parcelable = extras?.getParcelable<Parcelable>(key) ?: return null
      return when (parcelable) {
        is NotificationActionRecord -> parcelable
        is NotificationAction -> fromLegacy(parcelable)
        else -> null
      }
    }
  }
}

@Parcelize
@Serializable
data class NotificationCategoryRecord(
  @Field
  @Required
  val identifier: String,

  @Field
  @Required
  val actions: List<NotificationActionRecord>
) : Record, Parcelable
