package expo.modules.calendar.domain.event.records

import expo.modules.calendar.domain.event.enums.AlarmMethod
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class Alarm(
  @Field val relativeOffset: Int?,
  @Field val method: AlarmMethod?
) : Record
