package expo.modules.contacts.next.domain.model.event

import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.Event
import expo.modules.contacts.next.domain.wrappers.ContactDate

abstract class EventModel(
  val startDate: ContactDate?,
  val label: EventLabel
) {
  val mimeType = Event.CONTENT_ITEM_TYPE
  open val contentValues =
    ContentValues().apply {
      put(Event.START_DATE, startDate?.value)
      put(Event.TYPE, label.type)
      put(Event.LABEL, label.label)
    }
}
