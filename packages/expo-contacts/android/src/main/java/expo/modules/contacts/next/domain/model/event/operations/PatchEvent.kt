package expo.modules.contacts.next.domain.model.event.operations

import EventLabel
import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.Event
import expo.modules.contacts.next.domain.model.Patchable
import expo.modules.contacts.next.domain.model.event.EventModel
import expo.modules.contacts.next.domain.wrappers.ContactDate
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.kotlin.types.ValueOrUndefined

class PatchEvent(
  override val dataId: DataId,
  startDate: ValueOrUndefined<ContactDate?> = ValueOrUndefined.Undefined(),
  label: ValueOrUndefined<EventLabel> = ValueOrUndefined.Undefined()
) : EventModel(startDate.optional, label.optional ?: EventLabel.Unknown), Patchable {
  override val contentValues = ContentValues().apply {
    if (!startDate.isUndefined) {
      put(Event.START_DATE, startDate.optional?.value)
    }
    if (!label.isUndefined) {
      put(Event.TYPE, label.optional?.type)
      put(Event.LABEL, label.optional?.label)
    }
  }
}
