import android.provider.ContactsContract

sealed class WebsiteLabel {
  abstract val type: Int
  abstract val label: String?

  object Homepage : WebsiteLabel() {
    override val type = ContactsContract.CommonDataKinds.Website.TYPE_HOMEPAGE
    override val label: String = "homepage"
  }

  object Blog : WebsiteLabel() {
    override val type = ContactsContract.CommonDataKinds.Website.TYPE_BLOG
    override val label: String = "blog"
  }

  object Ftp : WebsiteLabel() {
    override val type = ContactsContract.CommonDataKinds.Website.TYPE_FTP
    override val label: String = "ftp"
  }

  object Home : WebsiteLabel() {
    override val type = ContactsContract.CommonDataKinds.Website.TYPE_HOME
    override val label: String = "home"
  }

  object Work : WebsiteLabel() {
    override val type = ContactsContract.CommonDataKinds.Website.TYPE_WORK
    override val label: String = "work"
  }

  object Other : WebsiteLabel() {
    override val type = ContactsContract.CommonDataKinds.Website.TYPE_OTHER
    override val label: String = "other"
  }

  object Profile : WebsiteLabel() {
    override val type = ContactsContract.CommonDataKinds.Website.TYPE_PROFILE
    override val label: String = "profile"
  }

  data class Custom(override val label: String) : WebsiteLabel() {
    override val type = ContactsContract.CommonDataKinds.Website.TYPE_CUSTOM
  }

  object Unknown : WebsiteLabel() {
    override val type = ContactsContract.CommonDataKinds.Website.TYPE_CUSTOM
    override val label: String = "unknown"
  }
}
