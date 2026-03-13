package expo.modules.contacts.next.domain.model.phone.operations

import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.phone.PhoneLabel
import expo.modules.contacts.next.domain.model.phone.PhoneModel
import expo.modules.contacts.next.domain.wrappers.RawContactId

class AppendablePhone(
  override val rawContactId: RawContactId,
  number: String?,
  label: PhoneLabel
) : PhoneModel(number, label), Appendable
