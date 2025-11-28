package expo.modules.contacts.next.domain.model.website.operations

import WebsiteLabel
import expo.modules.contacts.next.domain.model.Insertable
import expo.modules.contacts.next.domain.model.website.WebsiteModel

class NewWebsite(
  url: String?,
  label: WebsiteLabel
) : WebsiteModel(url, label), Insertable
