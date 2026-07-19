package expo.modules.contacts.next.domain.model.website.operations

import expo.modules.contacts.next.domain.model.website.WebsiteLabel
import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.website.WebsiteModel
import expo.modules.contacts.next.domain.wrappers.RawContactId

class AppendableWebsite(
  override val rawContactId: RawContactId,
  url: String?,
  label: WebsiteLabel
) : WebsiteModel(url, label), Appendable
