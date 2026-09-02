package expo.modules.calendar.next.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import java.io.Serializable

@OptimizedRecord
data class AddEventWithFormOptionsRecord(
  @Field val title: String? = null,
  @Field val location: String? = null,
  @Field val notes: String? = null,
  @Field val timeZone: String? = null,
  @Field val availability: EventAvailability? = null,
  @Field val allDay: Boolean? = null,
  @Field val startDate: String? = null,
  @Field val endDate: String? = null,
  @Field val recurrenceRule: RecurrenceRuleRecord? = null,
  @Field val startNewActivityTask: Boolean = true
) : Record, Serializable
