package expo.modules.contacts.next.domain.model.website

import android.provider.ContactsContract.CommonDataKinds.Website

sealed class WebsiteLabel(val type: Int?, val label: String? = null) {
  object Homepage : WebsiteLabel(Website.TYPE_HOMEPAGE)
  object Blog : WebsiteLabel(Website.TYPE_BLOG)
  object Ftp : WebsiteLabel(Website.TYPE_FTP)
  object Home : WebsiteLabel(Website.TYPE_HOME)
  object Work : WebsiteLabel(Website.TYPE_WORK)
  object Other : WebsiteLabel(Website.TYPE_OTHER)
  object Profile : WebsiteLabel(Website.TYPE_PROFILE)
  class Custom(label: String) : WebsiteLabel(Website.TYPE_CUSTOM, label)

  // Ideally these states would not be necessary, but Android does not enforce
  // type and label columns as non-null, so malformed label data can exist there.
  class MalformedType(label: String?) : WebsiteLabel(null, label)
  object MalformedCustom : WebsiteLabel(Website.TYPE_CUSTOM)
}
