package expo.modules.contacts.next.domain.model.organization.operations

import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.organization.OrganizationModel
import expo.modules.contacts.next.domain.wrappers.DataId

class ExistingOrganization(
  override val dataId: DataId,
  company: String?,
  department: String?,
  jobTitle: String?,
  phoneticName: String?
) : OrganizationModel(company, department, jobTitle, phoneticName), Updatable, Extractable
