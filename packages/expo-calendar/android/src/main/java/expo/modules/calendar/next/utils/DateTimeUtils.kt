package expo.modules.calendar.next.utils

import expo.modules.calendar.next.exceptions.DateParseException
import expo.modules.kotlin.types.Either
import java.text.ParseException
import java.util.Calendar

typealias DateTimeInput = Either<String, Long>

fun DateTimeInput.getTimeInMillis(): Long {
  if (this.`is`(Long::class)) {
    return this.second()
  }
  try {
    val parsedDate = sdf.parse(this.first())
      ?: throw DateParseException("Parsed date for string '${this.first()}' is null")
    return Calendar.getInstance().apply { time = parsedDate }.timeInMillis
  } catch (e: ParseException) {
    throw DateParseException("Date '${this.first()}' could not be parsed", e)
  }
}

fun String?.toMilliseconds(): Long? {
  if (this == null) return null
  return try {
    sdf.parse(this)?.let { Calendar.getInstance().apply { time = it }.timeInMillis }
      ?: throw DateParseException("Date '$this' could not be parsed")
  } catch (e: ParseException) {
    throw DateParseException("Date '$this' could not be parsed", e)
  }
}
