@file:OptIn(kotlinx.serialization.InternalSerializationApi::class) // silence a false positive warning
package expo.modules.notifications.notifications.categories

import android.os.Parcelable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Required
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