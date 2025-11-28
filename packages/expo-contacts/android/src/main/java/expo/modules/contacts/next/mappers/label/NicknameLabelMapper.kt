package expo.modules.contacts.next.mappers.label

import expo.modules.contacts.next.domain.model.nickname.NicknameLabel
import expo.modules.kotlin.types.ValueOrUndefined
import expo.modules.kotlin.types.map

object NicknameLabelMapper {
  fun toDomain(label: String?): NicknameLabel {
    if (label.isNullOrBlank()) {
      return NicknameLabel.Unknown
    }

    return when (label.lowercase()) {
      "default" -> NicknameLabel.Default
      "othername" -> NicknameLabel.OtherName
      "maidenname" -> NicknameLabel.MaidenName
      "shortname" -> NicknameLabel.ShortName
      "initials" -> NicknameLabel.Initials
      else -> NicknameLabel.Custom(label)
    }
  }

  fun toDomain(label: ValueOrUndefined<String?>): ValueOrUndefined<NicknameLabel> {
    return label.map { toDomain(it) }
  }

  fun toRecord(label: NicknameLabel): String? {
    return when (label) {
      is NicknameLabel.Default -> "default"
      is NicknameLabel.OtherName -> "otherName"
      is NicknameLabel.MaidenName -> "maidenName"
      is NicknameLabel.ShortName -> "shortName"
      is NicknameLabel.Initials -> "initials"
      is NicknameLabel.Custom -> label.label
      is NicknameLabel.Unknown -> "unknown"
    }
  }
}
