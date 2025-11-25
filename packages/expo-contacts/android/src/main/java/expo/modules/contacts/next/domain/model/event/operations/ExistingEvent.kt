package expo.modules.contacts.next.domain.model.event.operations

import EventLabel
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.event.EventModel
import expo.modules.contacts.next.domain.wrappers.ContactDate
import expo.modules.contacts.next.domain.wrappers.DataId

class ExistingEvent(
  override val dataId: DataId,
  startDate: ContactDate?,
  label: EventLabel
) : EventModel(startDate, label), Updatable.Data, Extractable.Data
