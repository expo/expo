package expo.modules.contacts.next.domain.model.email.operations

import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.email.EmailModel
import expo.modules.contacts.next.domain.model.email.EmailLabel
import expo.modules.contacts.next.domain.wrappers.DataId

class ExistingEmail(
  override val dataId: DataId,
  address: String?,
  label: EmailLabel
) : EmailModel(address, label), Updatable, Extractable
