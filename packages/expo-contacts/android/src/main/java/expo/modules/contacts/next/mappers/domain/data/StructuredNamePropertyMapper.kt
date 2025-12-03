package expo.modules.contacts.next.mappers.domain.data

import expo.modules.contacts.next.domain.model.structuredname.operations.AppendableStructuredName
import expo.modules.contacts.next.domain.model.structuredname.operations.ExistingStructuredName
import expo.modules.contacts.next.domain.model.structuredname.operations.PatchStructuredName
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.kotlin.types.ValueOrUndefined

sealed class StructuredNamePropertyMapper {
  object GivenName : MutableDataPropertyMapper<ExistingStructuredName, String?> {
    override fun toDto(model: ExistingStructuredName) = model.givenName
    override fun toUpdatable(dataId: DataId, newValue: String?) =
      PatchStructuredName(dataId, givenName = ValueOrUndefined.Value(newValue))
    override fun toAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableStructuredName(rawContactId = rawContactId, givenName = newValue)
  }

  object FamilyName : MutableDataPropertyMapper<ExistingStructuredName, String?> {
    override fun toDto(model: ExistingStructuredName) = model.familyName
    override fun toUpdatable(dataId: DataId, newValue: String?) =
      PatchStructuredName(dataId, familyName = ValueOrUndefined.Value(newValue))
    override fun toAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableStructuredName(rawContactId = rawContactId, familyName = newValue)
  }

  object MiddleName : MutableDataPropertyMapper<ExistingStructuredName, String?> {
    override fun toDto(model: ExistingStructuredName) = model.middleName
    override fun toUpdatable(dataId: DataId, newValue: String?) =
      PatchStructuredName(dataId, middleName = ValueOrUndefined.Value(newValue))
    override fun toAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableStructuredName(rawContactId = rawContactId, middleName = newValue)
  }

  object Prefix : MutableDataPropertyMapper<ExistingStructuredName, String?> {
    override fun toDto(model: ExistingStructuredName) = model.prefix
    override fun toUpdatable(dataId: DataId, newValue: String?) =
      PatchStructuredName(dataId, prefix = ValueOrUndefined.Value(newValue))
    override fun toAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableStructuredName(rawContactId = rawContactId, prefix = newValue)
  }

  object Suffix : MutableDataPropertyMapper<ExistingStructuredName, String?> {
    override fun toDto(model: ExistingStructuredName) = model.suffix
    override fun toUpdatable(dataId: DataId, newValue: String?) =
      PatchStructuredName(dataId, suffix = ValueOrUndefined.Value(newValue))
    override fun toAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableStructuredName(rawContactId = rawContactId, suffix = newValue)
  }

  object PhoneticGivenName : MutableDataPropertyMapper<ExistingStructuredName, String?> {
    override fun toDto(model: ExistingStructuredName) = model.phoneticGivenName
    override fun toUpdatable(dataId: DataId, newValue: String?) =
      PatchStructuredName(dataId, phoneticGivenName = ValueOrUndefined.Value(newValue))
    override fun toAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableStructuredName(rawContactId = rawContactId, phoneticGivenName = newValue)
  }

  object PhoneticFamilyName : MutableDataPropertyMapper<ExistingStructuredName, String?> {
    override fun toDto(model: ExistingStructuredName) = model.phoneticFamilyName
    override fun toUpdatable(dataId: DataId, newValue: String?) =
      PatchStructuredName(dataId, phoneticFamilyName = ValueOrUndefined.Value(newValue))
    override fun toAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableStructuredName(rawContactId = rawContactId, phoneticFamilyName = newValue)
  }

  object PhoneticMiddleName : MutableDataPropertyMapper<ExistingStructuredName, String?> {
    override fun toDto(model: ExistingStructuredName) = model.phoneticMiddleName
    override fun toUpdatable(dataId: DataId, newValue: String?) =
      PatchStructuredName(dataId, phoneticMiddleName = ValueOrUndefined.Value(newValue))
    override fun toAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableStructuredName(rawContactId = rawContactId, phoneticMiddleName = newValue)
  }
}