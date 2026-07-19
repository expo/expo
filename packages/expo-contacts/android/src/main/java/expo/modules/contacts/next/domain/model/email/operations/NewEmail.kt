package expo.modules.contacts.next.domain.model.email.operations

import expo.modules.contacts.next.domain.model.Insertable
import expo.modules.contacts.next.domain.model.email.EmailModel
import expo.modules.contacts.next.domain.model.email.EmailLabel

class NewEmail(
  address: String?,
  label: EmailLabel
) : EmailModel(address, label), Insertable
