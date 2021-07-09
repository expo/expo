package expo.modules.calendar

import android.content.ContentValues
import org.unimodules.core.arguments.ReadableArguments
import java.util.*

class CalendarEvenFactory(
  private val eventDetails: ReadableArguments
) {
  val eventValues = ContentValues()

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

  fun putEventStrings(vararg pairs: Pair<String, String>) = apply {
    pairs.forEach { putEventString(it.first, it.second) }
  }

  fun putEventBooleans(vararg pairs: Pair<String, String>) = apply {
    pairs.forEach { putEventBoolean(it.first, it.second) }
  }

  fun putEventTimeZones(vararg pairs: Pair<String, String>) = apply {
    pairs.forEach { putEventTimeZone(it.first, it.second) }
  }

  fun checkIfContainsRequiredKeys(vararg keys: String) = apply {
    keys.forEach { checkDetailsContainsRequiredKey(it) }
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
