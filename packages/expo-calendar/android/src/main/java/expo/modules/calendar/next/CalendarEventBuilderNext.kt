package expo.modules.calendar.next

import android.content.ContentValues

class CalendarEventBuilderNext() {
  private val eventValues = ContentValues()

  fun getAsLong(key: String): Long = eventValues.getAsLong(key)

  fun put(key: String, value: String) = apply {
    eventValues.put(key, value)
  }

  fun put(key: String, value: Int) = apply {
    eventValues.put(key, value)
  }

  fun put(key: String, value: Long) = apply {
    eventValues.put(key, value)
  }

  fun put(key: String, value: Boolean) = apply {
    eventValues.put(key, value)
  }

  fun putNull(key: String) = apply {
    eventValues.putNull(key)
  }

  fun build() = eventValues
}
