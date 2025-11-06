package expo.modules.contacts.next.services.property

import expo.modules.contacts.next.domain.model.structuredname.operations.AppendableStructuredName
import expo.modules.contacts.next.domain.model.structuredname.operations.ExistingStructuredName
import expo.modules.contacts.next.domain.model.structuredname.operations.PatchStructuredName
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.kotlin.types.ValueOrUndefined

sealed class StructuredNameProperty {
  object GivenName : PropertyAccessor<ExistingStructuredName, String> {
    override fun extractFrom(model: ExistingStructuredName) = model.givenName
    override fun toFieldPatchable(dataId: DataId, newValue: String?) =
      PatchStructuredName(dataId, givenName = ValueOrUndefined.Value(newValue))
    override fun toFieldAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableStructuredName(rawContactId = rawContactId, givenName = newValue)
  }

  object FamilyName : PropertyAccessor<ExistingStructuredName, String> {
    override fun extractFrom(model: ExistingStructuredName) = model.familyName
    override fun toFieldPatchable(dataId: DataId, newValue: String?) =
      PatchStructuredName(dataId, familyName = ValueOrUndefined.Value(newValue))
    override fun toFieldAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableStructuredName(rawContactId = rawContactId, familyName = newValue)
  }

  object MiddleName : PropertyAccessor<ExistingStructuredName, String> {
    override fun extractFrom(model: ExistingStructuredName) = model.middleName
    override fun toFieldPatchable(dataId: DataId, newValue: String?) =
      PatchStructuredName(dataId, middleName = ValueOrUndefined.Value(newValue))
    override fun toFieldAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableStructuredName(rawContactId = rawContactId, middleName = newValue)
  }

  object Prefix : PropertyAccessor<ExistingStructuredName, String> {
    override fun extractFrom(model: ExistingStructuredName) = model.prefix
    override fun toFieldPatchable(dataId: DataId, newValue: String?) =
      PatchStructuredName(dataId, prefix = ValueOrUndefined.Value(newValue))
    override fun toFieldAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableStructuredName(rawContactId = rawContactId, prefix = newValue)
  }

  object Suffix : PropertyAccessor<ExistingStructuredName, String> {
    override fun extractFrom(model: ExistingStructuredName) = model.suffix
    override fun toFieldPatchable(dataId: DataId, newValue: String?) =
      PatchStructuredName(dataId, suffix = ValueOrUndefined.Value(newValue))
    override fun toFieldAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableStructuredName(rawContactId = rawContactId, suffix = newValue)
  }

  object PhoneticGivenName : PropertyAccessor<ExistingStructuredName, String> {
    override fun extractFrom(model: ExistingStructuredName) = model.phoneticGivenName
    override fun toFieldPatchable(dataId: DataId, newValue: String?) =
      PatchStructuredName(dataId, phoneticGivenName = ValueOrUndefined.Value(newValue))
    override fun toFieldAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableStructuredName(rawContactId = rawContactId, phoneticGivenName = newValue)
  }

  object PhoneticFamilyName : PropertyAccessor<ExistingStructuredName, String> {
    override fun extractFrom(model: ExistingStructuredName) = model.phoneticFamilyName
    override fun toFieldPatchable(dataId: DataId, newValue: String?) =
      PatchStructuredName(dataId, phoneticFamilyName = ValueOrUndefined.Value(newValue))
    override fun toFieldAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableStructuredName(rawContactId = rawContactId, phoneticFamilyName = newValue)
  }

  object PhoneticMiddleName : PropertyAccessor<ExistingStructuredName, String> {
    override fun extractFrom(model: ExistingStructuredName) = model.phoneticMiddleName
    override fun toFieldPatchable(dataId: DataId, newValue: String?) =
      PatchStructuredName(dataId, phoneticMiddleName = ValueOrUndefined.Value(newValue))
    override fun toFieldAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableStructuredName(rawContactId = rawContactId, phoneticMiddleName = newValue)
  }
}
