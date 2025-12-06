package expo.modules.contacts.next.domain.model.event

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds.Event
import expo.modules.contacts.next.domain.model.ClearableField
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.event.operations.ExistingEvent
import expo.modules.contacts.next.domain.wrappers.ContactDate
import expo.modules.contacts.next.domain.wrappers.DataId

object EventField : ExtractableField.Data<ExistingEvent>, ClearableField {
  override val mimeType = Event.CONTENT_ITEM_TYPE

  override val projection = arrayOf(
    DataId.COLUMN_IN_DATA_TABLE,
    Event.START_DATE,
    Event.TYPE,
    Event.LABEL
  )

  override fun extract(cursor: Cursor): ExistingEvent = with(cursor) {
    val dateString = getString(getColumnIndexOrThrow(Event.START_DATE))

    return ExistingEvent(
      dataId = DataId(getString(getColumnIndexOrThrow(DataId.COLUMN_IN_DATA_TABLE))),
      startDate = if (dateString != null) ContactDate(dateString) else null,
      label = extractLabel()
    )
  }

  private fun Cursor.extractLabel(): EventLabel =
    when (getInt(getColumnIndexOrThrow(Event.TYPE))) {
      Event.TYPE_ANNIVERSARY -> EventLabel.Anniversary
      Event.TYPE_BIRTHDAY -> EventLabel.Birthday
      Event.TYPE_OTHER -> EventLabel.Other
      else -> {
        val customLabel = getString(getColumnIndexOrThrow(Event.LABEL))
        EventLabel.Custom(customLabel)
      }
    }
}
