package expo.modules.contacts.next.domain.model.website.operations

import WebsiteLabel
import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.Website
import expo.modules.contacts.next.domain.model.Patchable
import expo.modules.contacts.next.domain.model.website.WebsiteModel
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.kotlin.types.ValueOrUndefined

class PatchWebsite(
  override val dataId: DataId,
  url: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  label: ValueOrUndefined<WebsiteLabel> = ValueOrUndefined.Undefined()
) : WebsiteModel(url.optional, label.optional ?: WebsiteLabel.Unknown), Patchable {
  override val contentValues = ContentValues().apply {
    if (!url.isUndefined) {
      put(Website.URL, url.optional)
    }
    if (!label.isUndefined) {
      put(Website.TYPE, label.optional?.type)
      put(Website.LABEL, label.optional?.label)
    }
  }
}
