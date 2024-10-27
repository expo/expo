package expo.modules.calendar.dialogs

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

open class ViewEventIntentResult(
  @Field val action: String = "done"
) : Record
