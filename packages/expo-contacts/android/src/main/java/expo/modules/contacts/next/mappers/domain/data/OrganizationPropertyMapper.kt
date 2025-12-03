package expo.modules.contacts.next.mappers.domain.data

import expo.modules.contacts.next.domain.model.organization.operations.AppendableOrganization
import expo.modules.contacts.next.domain.model.organization.operations.ExistingOrganization
import expo.modules.contacts.next.domain.model.organization.operations.PatchOrganization
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.kotlin.types.ValueOrUndefined

sealed class OrganizationPropertyMapper {
  object Company : MutableDataPropertyMapper<ExistingOrganization, String?> {
    override fun toDto(model: ExistingOrganization) = model.company
    override fun toUpdatable(dataId: DataId, newValue: String?) =
      PatchOrganization(dataId, company = ValueOrUndefined.Value(newValue))
    override fun toAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableOrganization(rawContactId = rawContactId, company = newValue)
  }

  object Department : MutableDataPropertyMapper<ExistingOrganization, String?> {
    override fun toDto(model: ExistingOrganization) = model.department
    override fun toUpdatable(dataId: DataId, newValue: String?) =
      PatchOrganization(dataId, department = ValueOrUndefined.Value(newValue))
    override fun toAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableOrganization(rawContactId = rawContactId, department = newValue)
  }

  object JobTitle : MutableDataPropertyMapper<ExistingOrganization, String?> {
    override fun toDto(model: ExistingOrganization) = model.jobTitle
    override fun toUpdatable(dataId: DataId, newValue: String?) =
      PatchOrganization(dataId, jobTitle = ValueOrUndefined.Value(newValue))
    override fun toAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableOrganization(rawContactId = rawContactId, jobTitle = newValue)
  }

  object PhoneticName : MutableDataPropertyMapper<ExistingOrganization, String?> {
    override fun toDto(model: ExistingOrganization) = model.phoneticName
    override fun toUpdatable(dataId: DataId, newValue: String?) =
      PatchOrganization(dataId, phoneticName = ValueOrUndefined.Value(newValue))
    override fun toAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableOrganization(rawContactId = rawContactId, phoneticName = newValue)
  }
}