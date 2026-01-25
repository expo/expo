package expo.modules.contacts.next.domain.model.organization.operations

import expo.modules.contacts.next.domain.model.Insertable
import expo.modules.contacts.next.domain.model.organization.OrganizationModel

class NewOrganization(
  company: String?,
  department: String?,
  jobTitle: String?,
  phoneticName: String?
) : OrganizationModel(company, department, jobTitle, phoneticName), Insertable
