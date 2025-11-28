package expo.modules.contacts.next.domain.model.website

import WebsiteLabel
import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds.Website
import expo.modules.contacts.next.domain.model.ClearableField
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.website.operations.ExistingWebsite
import expo.modules.contacts.next.domain.wrappers.DataId

object WebsiteField : ExtractableField.Data<ExistingWebsite>, ClearableField {
  override val projection = arrayOf(Website._ID, Website.URL, Website.TYPE, Website.LABEL)

  override val mimeType = Website.CONTENT_ITEM_TYPE

  override fun extract(cursor: Cursor): ExistingWebsite = with(cursor) {
    return ExistingWebsite(
      dataId = DataId(getString(getColumnIndexOrThrow(DataId.COLUMN_IN_DATA_TABLE))),
      url = getString(getColumnIndexOrThrow(Website.URL)),
      label = extractLabel()
    )
  }

  private fun Cursor.extractLabel() =
    when (getInt(getColumnIndexOrThrow(Website.TYPE))) {
      Website.TYPE_HOMEPAGE -> WebsiteLabel.Homepage
      Website.TYPE_BLOG -> WebsiteLabel.Blog
      Website.TYPE_FTP -> WebsiteLabel.Ftp
      Website.TYPE_HOME -> WebsiteLabel.Home
      Website.TYPE_WORK -> WebsiteLabel.Work
      Website.TYPE_OTHER -> WebsiteLabel.Other
      Website.TYPE_PROFILE -> WebsiteLabel.Profile
      Website.TYPE_CUSTOM -> {
        val customLabel = getString(getColumnIndexOrThrow(Website.LABEL))
        WebsiteLabel.Custom(customLabel)
      }
      else -> WebsiteLabel.Unknown
    }
}
