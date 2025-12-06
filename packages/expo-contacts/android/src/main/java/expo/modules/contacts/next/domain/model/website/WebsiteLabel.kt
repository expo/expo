package expo.modules.contacts.next.domain.model.website

import android.provider.ContactsContract.CommonDataKinds.Website

sealed class WebsiteLabel {
  abstract val type: Int
  open val label: String? = null

  object Homepage : WebsiteLabel() {
    override val type = Website.TYPE_HOMEPAGE
  }

  object Blog : WebsiteLabel() {
    override val type = Website.TYPE_BLOG
  }

  object Ftp : WebsiteLabel() {
    override val type = Website.TYPE_FTP
  }

  object Home : WebsiteLabel() {
    override val type = Website.TYPE_HOME
  }

  object Work : WebsiteLabel() {
    override val type = Website.TYPE_WORK
  }

  object Other : WebsiteLabel() {
    override val type = Website.TYPE_OTHER
  }

  object Profile : WebsiteLabel() {
    override val type = Website.TYPE_PROFILE
  }

  data class Custom(override val label: String) : WebsiteLabel() {
    override val type = Website.TYPE_CUSTOM
  }
}
