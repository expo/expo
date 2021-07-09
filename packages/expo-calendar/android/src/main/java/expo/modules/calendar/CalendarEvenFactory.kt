package expo.modules.calendar

import android.content.ContentValues
import org.unimodules.core.arguments.ReadableArguments
import java.util.*

class CalendarEvenFactory(
  private val eventDetails: ReadableArguments
) {
  val eventValues = ContentValues()

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

  fun putEventStrings(vararg pairs: Pair<String, String>): CalendarEvenFactory {
    pairs.forEach { putEventString(it.first, it.second) }
    return this
  }

  fun putEventBooleans(vararg pairs: Pair<String, String>): CalendarEvenFactory {
    pairs.forEach { putEventBoolean(it.first, it.second) }
    return this
  }

  fun putEventTimeZones(vararg pairs: Pair<String, String>): CalendarEvenFactory {
    pairs.forEach { putEventTimeZone(it.first, it.second) }
    return this
  }

  fun checkIfContainsRequiredKeys(vararg keys: String): CalendarEvenFactory {
    keys.forEach { checkDetailsContainsRequiredKey(it) }
    return this
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

  private fun putEventTimeZone(eventKey: String, detailsKey: String) {
    eventValues.put(
      eventKey,
      if (eventDetails.containsKey(detailsKey)) {
        eventDetails.getString(detailsKey)
      } else {
        TimeZone.getDefault().id
      }
    )
  }

  private fun checkDetailsContainsRequiredKey(key: String) {
    if (!eventDetails.containsKey(key)) {
      throw Exception("new calendars require $key")
    }
  }
}
