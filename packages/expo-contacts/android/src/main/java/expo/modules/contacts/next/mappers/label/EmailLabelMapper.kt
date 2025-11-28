package expo.modules.contacts.next.mappers.label

import expo.modules.contacts.next.domain.model.email.EmailLabel
import expo.modules.kotlin.types.ValueOrUndefined
import expo.modules.kotlin.types.map

object EmailLabelMapper {
  fun toDomain(label: String?): EmailLabel {
    if (label.isNullOrBlank()) {
      return EmailLabel.Unknown
    }

    return when (label.lowercase()) {
      "home" -> EmailLabel.Home
      "work" -> EmailLabel.Work
      "mobile" -> EmailLabel.Mobile
      "other" -> EmailLabel.Other
      else -> EmailLabel.Custom(label)
    }
  }

  fun toDomain(label: ValueOrUndefined<String?>): ValueOrUndefined<EmailLabel> {
    return label.map { toDomain(it) }
  }

  fun toRecord(label: EmailLabel): String? {
    return when (label) {
      is EmailLabel.Home -> "home"
      is EmailLabel.Work -> "work"
      is EmailLabel.Mobile -> "mobile"
      is EmailLabel.Other -> "other"
      is EmailLabel.Custom -> label.label
      is EmailLabel.Unknown -> null
    }
  }
}
