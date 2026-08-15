package expo.modules.contacts.next.domain.model.website

import android.content.ContentValues
import android.provider.ContactsContract
import android.provider.ContactsContract.CommonDataKinds.Website

abstract class WebsiteModel(
  val url: String?,
  val label: WebsiteLabel
) {
  val mimeType = Website.CONTENT_ITEM_TYPE
  open val contentValues =
    ContentValues().apply {
      put(ContactsContract.Data.MIMETYPE, mimeType)
      put(Website.URL, url)
      put(Website.TYPE, label.type)
      put(Website.LABEL, label.label)
    }
}
