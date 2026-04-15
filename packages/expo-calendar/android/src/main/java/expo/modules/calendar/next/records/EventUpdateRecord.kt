package expo.modules.calendar.next.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.ValueOrUndefined

data class EventUpdateRecord(
  @Field val title: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val startDate: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val endDate: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val location: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val timeZone: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val endTimeZone: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val notes: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val alarms: ValueOrUndefined<List<AlarmRecord>?> = ValueOrUndefined.Undefined(),
  @Field val recurrenceRule: ValueOrUndefined<RecurrenceRuleRecord?> = ValueOrUndefined.Undefined(),
  @Field val allDay: ValueOrUndefined<Boolean?> = ValueOrUndefined.Undefined(),
  @Field val availability: ValueOrUndefined<EventAvailability?> = ValueOrUndefined.Undefined(),
  @Field val organizerEmail: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val accessLevel: ValueOrUndefined<EventAccessLevel?> = ValueOrUndefined.Undefined(),
  @Field val guestsCanModify: ValueOrUndefined<Boolean?> = ValueOrUndefined.Undefined(),
  @Field val guestsCanInviteOthers: ValueOrUndefined<Boolean?> = ValueOrUndefined.Undefined(),
  @Field val guestsCanSeeGuests: ValueOrUndefined<Boolean?> = ValueOrUndefined.Undefined()
) : Record
