package expo.modules.contacts.next.mappers.domain.data.list

import expo.modules.contacts.next.domain.model.event.operations.AppendableEvent
import expo.modules.contacts.next.domain.model.event.operations.ExistingEvent
import expo.modules.contacts.next.domain.model.event.operations.NewEvent
import expo.modules.contacts.next.domain.model.event.operations.PatchEvent
import expo.modules.contacts.next.domain.wrappers.ContactDate
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.mappers.domain.data.list.label.EventLabelMapper
import expo.modules.contacts.next.records.fields.DateRecord
import expo.modules.kotlin.types.map

object EventMapper : ListDataPropertyMapper<ExistingEvent, DateRecord.Existing, DateRecord.New> {
  fun toNew(record: DateRecord.New) =
    NewEvent(
      startDate = toDomain(record.date),
      label = EventLabelMapper.toDomain(record.label)
    )

  override fun toAppendable(newValue: DateRecord.New, rawContactId: RawContactId) =
    AppendableEvent(
      rawContactId = rawContactId,
      startDate = toDomain(newValue.date),
      label = EventLabelMapper.toDomain(newValue.label)
    )

  override fun toUpdatable(newValue: DateRecord.Existing) =
    ExistingEvent(
      dataId = DataId(newValue.id),
      startDate = toDomain(newValue.date),
      label = EventLabelMapper.toDomain(newValue.label)
    )

  fun toPatch(record: DateRecord.Patch) =
    PatchEvent(
      dataId = DataId(record.id),
      startDate = record.date.map { toDomain(it) },
      label = EventLabelMapper.toDomain(record.label)
    )

  override fun toDto(model: ExistingEvent): DateRecord.Existing {
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
