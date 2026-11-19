package expo.modules.widgets.notifications

import android.os.Bundle
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.types.ValueOrUndefined

@OptimizedRecord
internal data class CustomNotificationOptions(
  @Field val channelId: String? = null,
  @Field val title: String? = null,
  @Field val text: String? = null,
  @Field val ongoing: Boolean = false,
  @Field val autoCancel: Boolean = true,
  @Field val alertOnlyOnce: Boolean = true,
  @Field val timeoutAfter: Long? = null,
  @Field val url: String? = null,
  @Field val smallIcon: String? = null,
  @Field val color: String? = null
) : Record {
  fun merge(overrides: CustomNotificationUpdateOptions): CustomNotificationOptions {
    return copy(
      channelId = overrides.channelId.orElse(channelId),
      title = overrides.title.orElse(title),
      text = overrides.text.orElse(text),
      ongoing = overrides.ongoing.orElse(ongoing),
      autoCancel = overrides.autoCancel.orElse(autoCancel),
      alertOnlyOnce = overrides.alertOnlyOnce.orElse(alertOnlyOnce),
      timeoutAfter = overrides.timeoutAfter.orElse(timeoutAfter),
      url = overrides.url.orElse(url),
      smallIcon = overrides.smallIcon.orElse(smallIcon),
      color = overrides.color.orElse(color)
    )
  }

  fun toBundle(): Bundle = Bundle().apply {
    putString("channelId", channelId)
    putString("title", title)
    putString("text", text)
    putBoolean("ongoing", ongoing)
    putBoolean("autoCancel", autoCancel)
    putBoolean("alertOnlyOnce", alertOnlyOnce)
    timeoutAfter?.let { putLong("timeoutAfter", it) }
    putString("url", url)
    putString("smallIcon", smallIcon)
    putString("color", color)
  }

  companion object {
    fun fromBundle(bundle: Bundle): CustomNotificationOptions = with(bundle) {
      CustomNotificationOptions(
        channelId = getString("channelId"),
        title = getString("title"),
        text = getString("text"),
        ongoing = getBoolean("ongoing", false),
        autoCancel = getBoolean("autoCancel", true),
        alertOnlyOnce = getBoolean("alertOnlyOnce", true),
        timeoutAfter = if (containsKey("timeoutAfter")) getLong("timeoutAfter") else null,
        url = getString("url"),
        smallIcon = getString("smallIcon"),
        color = getString("color")
      )
    }
  }
}

// Undefined fields keep their current value; explicit null clears a nullable option.
@OptimizedRecord
internal data class CustomNotificationUpdateOptions(
  @Field val channelId: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val title: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val text: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val ongoing: ValueOrUndefined<Boolean> = ValueOrUndefined.Undefined(),
  @Field val autoCancel: ValueOrUndefined<Boolean> = ValueOrUndefined.Undefined(),
  @Field val alertOnlyOnce: ValueOrUndefined<Boolean> = ValueOrUndefined.Undefined(),
  @Field val timeoutAfter: ValueOrUndefined<Long?> = ValueOrUndefined.Undefined(),
  @Field val url: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val smallIcon: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val color: ValueOrUndefined<String?> = ValueOrUndefined.Undefined()
) : Record

private fun <T> ValueOrUndefined<T>.orElse(fallback: T): T = when (this) {
  is ValueOrUndefined.Value -> value
  is ValueOrUndefined.Undefined -> fallback
}
