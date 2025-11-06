package expo.modules.contacts.next.domain.model.website.operations

import WebsiteLabel
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.website.WebsiteModel
import expo.modules.contacts.next.domain.wrappers.DataId

class ExistingWebsite(
  override val dataId: DataId,
  url: String?,
  label: WebsiteLabel
) : WebsiteModel(url, label), Extractable, Updatable
