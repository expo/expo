package expo.modules.calendar.domain.event.records.input

import expo.modules.calendar.extensions.DateTimeInput
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Required
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
data class RemoveEventInput(
  @Field @Required val id: String,
  @Field val instanceStartDate: DateTimeInput?
) : Record
