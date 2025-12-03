package expo.modules.contacts.next.mappers.domain.data.list.label

import WebsiteLabel
import expo.modules.kotlin.types.ValueOrUndefined
import expo.modules.kotlin.types.map

object WebsiteLabelMapper {
  fun toDomain(label: String?): WebsiteLabel {
    if (label.isNullOrBlank()) {
      return WebsiteLabel.Unknown
    }

    return when (label.lowercase()) {
      "homepage" -> WebsiteLabel.Homepage
      "blog" -> WebsiteLabel.Blog
      "ftp" -> WebsiteLabel.Ftp
      "home" -> WebsiteLabel.Home
      "work" -> WebsiteLabel.Work
      "other" -> WebsiteLabel.Other
      "profile" -> WebsiteLabel.Profile
      else -> WebsiteLabel.Custom(label)
    }
  }

  fun toDomain(label: ValueOrUndefined<String?>): ValueOrUndefined<WebsiteLabel> {
    return label.map { toDomain(it) }
  }

  fun toRecord(label: WebsiteLabel): String? {
    return when (label) {
      is WebsiteLabel.Homepage -> "homepage"
      is WebsiteLabel.Blog -> "blog"
      is WebsiteLabel.Ftp -> "ftp"
      is WebsiteLabel.Home -> "home"
      is WebsiteLabel.Work -> "work"
      is WebsiteLabel.Other -> "other"
      is WebsiteLabel.Profile -> "profile"
      is WebsiteLabel.Custom -> label.label
      is WebsiteLabel.Unknown -> "unknown"
    }
  }
}
