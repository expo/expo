package expo.modules.contacts.next.domain.model.organization.operations

import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.organization.OrganizationModel
import expo.modules.contacts.next.domain.wrappers.RawContactId

class AppendableOrganization(
  override val rawContactId: RawContactId,
  company: String? = null,
  department: String? = null,
  jobTitle: String? = null,
  phoneticName: String? = null
) : OrganizationModel(company, department, jobTitle, phoneticName), Appendable
