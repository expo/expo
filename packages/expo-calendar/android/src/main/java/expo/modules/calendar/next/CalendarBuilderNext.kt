package expo.modules.calendar.next

import android.content.ContentValues

class CalendarBuilderNext() {
  private val eventValues = ContentValues()

  fun getAsLong(key: String): Long = eventValues.getAsLong(key)

  fun put(key: String, value: String?) = apply {
    value?.let { eventValues.put(key, it) }
  }

  fun put(key: String, value: Int?) = apply {
    value?.let { eventValues.put(key, it)}
  }

  fun put(key: String, value: Long?) = apply {
    value?.let { eventValues.put(key, it) }
  }

  fun put(key: String, value: Boolean?) = apply {
    value?.let { eventValues.put(key, it) }
  }

  fun putNull(key: String) = apply {
    eventValues.putNull(key)
  }

  fun build() = eventValues
}
