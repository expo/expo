package expo.modules.calendar.dialogs

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class EventIntentResult(
  @Field val action: String = "done"
) : Record
