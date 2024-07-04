package expo.modules.calendar.dialogs

import expo.modules.core.arguments.ReadableArguments
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class CreatedEventOptions : Record, Serializable {
  @Field
  var title: String? = null

  @Field
  var location: String? = null

  @Field
  var notes: String? = null

  @Field
  var timeZone: String? = null

  @Field
  var availability: String? = null

  @Field
  var allDay: Boolean? = null

  @Field
  var startDate: String? = null

  @Field
  var endDate: String? = null

  @Field
  var recurrenceRule: ReadableArguments? = null

  @Field
  var startNewActivityTask: Boolean = true
}
