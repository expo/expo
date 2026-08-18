package expo.modules.contacts.next.domain.model.website

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds.Website
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.website.operations.ExistingWebsite
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.extensions.getNullableInt
import expo.modules.contacts.next.extensions.getNullableString
import expo.modules.contacts.next.extensions.getRequiredString

object WebsiteField : ExtractableField.Data<ExistingWebsite> {
  override val projection = arrayOf(Website._ID, Website.URL, Website.TYPE, Website.LABEL)

  override val mimeType = Website.CONTENT_ITEM_TYPE

  override fun extract(cursor: Cursor): ExistingWebsite = with(cursor) {
    return ExistingWebsite(
      dataId = DataId(getRequiredString(getColumnIndexOrThrow(DataId.COLUMN_IN_DATA_TABLE))),
      url = getNullableString(getColumnIndexOrThrow(Website.URL)),
      label = extractLabel()
    )
  }

  private fun Cursor.extractLabel() =
    when (getNullableInt(Website.TYPE)) {
      Website.TYPE_HOMEPAGE -> WebsiteLabel.Homepage
      Website.TYPE_BLOG -> WebsiteLabel.Blog
      Website.TYPE_FTP -> WebsiteLabel.Ftp
      Website.TYPE_HOME -> WebsiteLabel.Home
      Website.TYPE_WORK -> WebsiteLabel.Work
      Website.TYPE_OTHER -> WebsiteLabel.Other
      Website.TYPE_PROFILE -> WebsiteLabel.Profile
      null -> {
        val customLabel = getNullableString(getColumnIndexOrThrow(Website.LABEL))
        WebsiteLabel.MalformedType(customLabel)
      }
      else -> {
        val customLabel = getNullableString(getColumnIndexOrThrow(Website.LABEL))
        customLabel?.let { WebsiteLabel.Custom(it) } ?: WebsiteLabel.MalformedCustom
      }
    }
}
