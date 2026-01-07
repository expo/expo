package expo.modules.calendar.domain.event.records.input

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Required

class EventUpdateInput : Record, EventInputBase() {
  @Field @Required
  val id: String = ""
}
