package expo.modules.contacts.next.domain.model.phone.operations

import expo.modules.contacts.next.domain.model.Insertable
import expo.modules.contacts.next.domain.model.phone.PhoneLabel
import expo.modules.contacts.next.domain.model.phone.PhoneModel

class NewPhone(
  number: String?,
  label: PhoneLabel
) : PhoneModel(number, label), Insertable
