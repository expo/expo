package expo.modules.contacts.next.mappers.domain.data

import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId

interface MutableDataPropertyMapper<TDomain : Extractable.Data, TDto> : DataPropertyMapper<TDomain, TDto> {
  fun toUpdatable(dataId: DataId, newValue: TDto): Updatable.Data

  // In the Data table, a specific row (e.g. Note, Image) might not exist yet,
  // so we need the ability to either append or update it.
  // Whereas for the Contacts table (as seen in MutableContactsPropertyMapper),
  // there is only one entry per contact, so only an update method is necessary.
  fun toAppendable(newValue: TDto, rawContactId: RawContactId): Appendable
}
