package expo.modules.calendar.next.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.ValueOrUndefined

data class AttendeeUpdateRecord(
  @Field val email: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val name: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val role: ValueOrUndefined<AttendeeRole?> = ValueOrUndefined.Undefined(),
  @Field val status: ValueOrUndefined<AttendeeStatus?> = ValueOrUndefined.Undefined(),
  @Field val type: ValueOrUndefined<AttendeeType?> = ValueOrUndefined.Undefined()
) : Record
