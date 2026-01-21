package expo.modules.contacts.next.domain.model.email.operations

import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.email.EmailModel
import expo.modules.contacts.next.domain.model.email.EmailLabel
import expo.modules.contacts.next.domain.wrappers.RawContactId

class AppendableEmail(
  override val rawContactId: RawContactId,
  address: String?,
  label: EmailLabel
) : EmailModel(address, label), Appendable
