package expo.modules.calendar.extensions

import expo.modules.calendar.CalendarUtils
import expo.modules.calendar.exceptions.DateParseException
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.types.Either
import java.text.ParseException
import java.util.Calendar

// Represents date/time input from JS. Can be either string or number.
@OptIn(EitherType::class)
typealias DateTimeInput = Either<String, Long>

// Returns Unix timestamp in milliseconds.
@OptIn(EitherType::class)
fun DateTimeInput.getTimeInMillis(): Long? {
  if (this.`is`(Long::class)) {
    return this.second()
  }

  try {
    val parsedDate = CalendarUtils.sdf.parse(this.first())
    if (parsedDate == null) {
      throw DateParseException("Parsed date for string '${this.first()}' is null")
    }
    val cal = Calendar.getInstance().apply { time = parsedDate }
    return cal.timeInMillis
  } catch (e: ParseException) {
    throw DateParseException("Date '${this.first()}' could not be parsed", e)
  }
}
