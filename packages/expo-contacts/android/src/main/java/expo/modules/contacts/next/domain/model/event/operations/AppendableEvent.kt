package expo.modules.contacts.next.domain.model.event.operations

import expo.modules.contacts.next.domain.model.event.EventLabel
import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.event.EventModel
import expo.modules.contacts.next.domain.wrappers.ContactDate
import expo.modules.contacts.next.domain.wrappers.RawContactId

class AppendableEvent(
  override val rawContactId: RawContactId,
  startDate: ContactDate?,
  label: EventLabel
) : EventModel(startDate, label), Appendable
