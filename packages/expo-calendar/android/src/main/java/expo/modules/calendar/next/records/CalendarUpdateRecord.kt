package expo.modules.calendar.next.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.ValueOrUndefined

data class CalendarUpdateRecord(
  @Field val name: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val title: ValueOrUndefined<String> = ValueOrUndefined.Undefined(),
  @Field val color: ValueOrUndefined<Int> = ValueOrUndefined.Undefined(),
  @Field val isVisible: ValueOrUndefined<Boolean?> = ValueOrUndefined.Undefined(),
  @Field val isSynced: ValueOrUndefined<Boolean?> = ValueOrUndefined.Undefined(),
  @Field val timeZone: ValueOrUndefined<String?> = ValueOrUndefined.Undefined()
) : Record
