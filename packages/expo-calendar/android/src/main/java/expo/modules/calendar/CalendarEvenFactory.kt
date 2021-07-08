package expo.modules.calendar

import android.content.ContentValues
import org.unimodules.core.arguments.ReadableArguments

class CalendarEvenFactory(private val eventDetails: ReadableArguments) {
  val eventValues = ContentValues()

  fun putEventStrings(vararg pairs: Pair<String, String>) {
    pairs.forEach { putEventString(it.first, it.second) }
  }

  fun putEventBooleans(vararg pairs: Pair<String, String>) {
    pairs.forEach { putEventBoolean(it.first, it.second) }
  }

  fun checkIfContainsRequiredKeys(vararg keys: String) {
    keys.forEach { checkDetailsContainsRequiredKey(it) }
  }

  fun put(key: String, value: String) {
    eventValues.put(key, value)
  }

  fun put(key: String, value: Int) {
    eventValues.put(key, value)
  }

  fun put(key: String, value: Long) {
    eventValues.put(key, value)
  }

  fun put(key: String, value: Boolean) {
    eventValues.put(key, value)
  }

  fun putNull(key: String) {
    eventValues.putNull(key)
  }

  private fun putEventString(eventKey: String, detailsKey: String) {
    if (eventDetails.containsKey(detailsKey)) {
      eventValues.put(eventKey, eventDetails.getString(detailsKey))
    }
  }

  private fun putEventBoolean(eventKey: String, detailsKey: String) {
    if (eventDetails.containsKey(detailsKey)) {
      eventValues.put(eventKey, if (eventDetails.getBoolean(detailsKey)) 1 else 0)
    }
  }

  private fun checkDetailsContainsRequiredKey(key: String) {
    if (!eventDetails.containsKey(key)) {
      throw Exception("new calendars require $key")
    }
  }
}
