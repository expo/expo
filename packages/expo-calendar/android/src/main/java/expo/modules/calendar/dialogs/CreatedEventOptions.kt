package expo.modules.calendar.dialogs

import expo.modules.calendar.domain.event.enums.Availability
import expo.modules.calendar.domain.event.records.input.RecurrenceRuleInput
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class CreatedEventOptions : Record, Serializable {
  @Field
  val title: String? = null

  @Field
  val location: String? = null

  @Field
  val notes: String? = null

  @Field
  val timeZone: String? = null

  @Field
  val availability: Availability? = null

  @Field
  val allDay: Boolean? = null

  @Field
  val startDate: String? = null

  @Field
  val endDate: String? = null

  @Field
  val recurrenceRule: RecurrenceRuleInput? = null

  @Field
  val startNewActivityTask: Boolean = true
}
