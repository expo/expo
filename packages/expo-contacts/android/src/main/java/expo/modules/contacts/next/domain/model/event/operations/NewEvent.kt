package expo.modules.contacts.next.domain.model.event.operations

import EventLabel
import expo.modules.contacts.next.domain.model.Insertable
import expo.modules.contacts.next.domain.model.event.EventModel
import expo.modules.contacts.next.domain.wrappers.ContactDate

class NewEvent(
  startDate: ContactDate?,
  label: EventLabel
) : EventModel(startDate, label), Insertable
