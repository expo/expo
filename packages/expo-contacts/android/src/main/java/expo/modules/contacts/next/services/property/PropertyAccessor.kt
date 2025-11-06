package expo.modules.contacts.next.services.property

import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.Patchable
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId

interface PropertyAccessor<TExisting : Extractable, TPropertyValue> {
  fun extractFrom(model: TExisting): TPropertyValue?
  fun toFieldPatchable(dataId: DataId, newValue: TPropertyValue?): Patchable
  fun toFieldAppendable(newValue: TPropertyValue?, rawContactId: RawContactId): Appendable
}
