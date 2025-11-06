package expo.modules.contacts.next.mappers.model

import expo.modules.contacts.next.domain.model.event.operations.AppendableEvent
import expo.modules.contacts.next.domain.model.event.operations.ExistingEvent
import expo.modules.contacts.next.domain.model.event.operations.NewEvent
import expo.modules.contacts.next.domain.model.event.operations.PatchEvent
import expo.modules.contacts.next.domain.wrappers.ContactDate
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.mappers.label.EventLabelMapper
import expo.modules.contacts.next.records.fields.DateRecord
import expo.modules.kotlin.types.map

object EventMapper {
  fun toNew(record: DateRecord.New): NewEvent =
    NewEvent(
      startDate = toDomain(record.date),
      label = EventLabelMapper.toDomain(record.label)
    )

  fun toAppendable(record: DateRecord.New, rawContactId: RawContactId): AppendableEvent =
    AppendableEvent(
      rawContactId = rawContactId,
      startDate = toDomain(record.date),
      label = EventLabelMapper.toDomain(record.label)
    )

  fun toExisting(record: DateRecord.Existing): ExistingEvent =
    ExistingEvent(
      dataId = DataId(record.id),
      startDate = toDomain(record.date),
      label = EventLabelMapper.toDomain(record.label)
    )

  fun toPatch(record: DateRecord.Patch): PatchEvent =
    PatchEvent(
      dataId = DataId(record.id),
      startDate = record.date.map { toDomain(it) },
      label = EventLabelMapper.toDomain(record.label)
    )

  fun toRecord(model: ExistingEvent): DateRecord.Existing {
    val contactDateRecord = model.startDate?.let {
      DateRecord.ContactDateRecord(
        year = it.year,
        month = it.month,
        day = it.day
      )
    }
    return DateRecord.Existing(
      id = model.dataId.value,
      label = EventLabelMapper.toRecord(model.label),
      date = contactDateRecord
    )
  }

  private fun toDomain(record: DateRecord.ContactDateRecord?): ContactDate? {
    if (record == null) {
      return null
    }
    val (year, month, day) = record
    return if (year != null) {
      ContactDate("$year-$month-$day")
    } else {
      ContactDate("--$month-$day")
    }
  }
}
