package expo.modules.calendar.dialogs

import expo.modules.core.arguments.ReadableArguments
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

data class CreatedEventOptions(
  @Field val title: String?,
  @Field val location: String?,
  @Field val notes: String?,
  @Field val timeZone: String?,
  @Field val availability: String?,
  @Field val allDay: Boolean?,
  @Field val startDate: String?,
  @Field val endDate: String?,
  @Field val recurrenceRule: ReadableArguments?,
  // presentation options
  @Field val startNewActivityTask: Boolean?
) : Record, Serializable
