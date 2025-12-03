package expo.modules.contacts.next.mappers.domain.data.list

import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.records.ExistingRecord
import expo.modules.contacts.next.records.NewRecord

interface ListDataPropertyMapper<
  TDomain: Extractable. Data,
  TExistingDto: ExistingRecord,
  TNewDto: NewRecord,
  >{
  fun toDto(model: TDomain): TExistingDto
  fun toUpdatable(newValue: TExistingDto): Updatable.Data
  fun toAppendable(newValue: TNewDto, rawContactId: RawContactId): Appendable
}
