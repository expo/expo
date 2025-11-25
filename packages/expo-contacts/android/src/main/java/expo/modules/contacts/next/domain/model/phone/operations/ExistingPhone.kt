package expo.modules.contacts.next.domain.model.phone.operations

import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.phone.PhoneLabel
import expo.modules.contacts.next.domain.model.phone.PhoneModel
import expo.modules.contacts.next.domain.wrappers.DataId

class ExistingPhone(
  override val dataId: DataId,
  number: String?,
  label: PhoneLabel
) : PhoneModel(number, label), Updatable.Data, Extractable.Data
