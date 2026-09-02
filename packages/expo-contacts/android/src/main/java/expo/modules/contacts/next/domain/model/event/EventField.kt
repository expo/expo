package expo.modules.contacts.next.domain.model.event

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds.Event
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.event.operations.ExistingEvent
import expo.modules.contacts.next.domain.wrappers.ContactDate
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.extensions.getNullableInt
import expo.modules.contacts.next.extensions.getNullableString
import expo.modules.contacts.next.extensions.getRequiredString

object EventField : ExtractableField.Data<ExistingEvent> {
  override val mimeType = Event.CONTENT_ITEM_TYPE

  override val projection = arrayOf(
    DataId.COLUMN_IN_DATA_TABLE,
    Event.START_DATE,
    Event.TYPE,
    Event.LABEL
  )

  override fun extract(cursor: Cursor): ExistingEvent = with(cursor) {
    val dateString = getNullableString(getColumnIndexOrThrow(Event.START_DATE))

    return ExistingEvent(
      dataId = DataId(getRequiredString(getColumnIndexOrThrow(DataId.COLUMN_IN_DATA_TABLE))),
      startDate = if (dateString != null) ContactDate(dateString) else null,
      label = extractLabel()
    )
  }

  private fun Cursor.extractLabel(): EventLabel =
    when (getNullableInt(Event.TYPE)) {
      Event.TYPE_ANNIVERSARY -> EventLabel.Anniversary
      Event.TYPE_BIRTHDAY -> EventLabel.Birthday
      Event.TYPE_OTHER -> EventLabel.Other
      null -> {
        val customLabel = getNullableString(getColumnIndexOrThrow(Event.LABEL))
        EventLabel.MalformedType(customLabel)
      }
      else -> {
        val customLabel = getNullableString(getColumnIndexOrThrow(Event.LABEL))
        customLabel?.let { EventLabel.Custom(it) } ?: EventLabel.MalformedCustom
      }
    }
}
