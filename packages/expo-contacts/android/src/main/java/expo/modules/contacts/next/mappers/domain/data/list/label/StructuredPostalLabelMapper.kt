package expo.modules.contacts.next.mappers.domain.data.list.label

import expo.modules.contacts.next.domain.model.structuredpostal.StructuredPostalLabel
import expo.modules.kotlin.types.ValueOrUndefined
import expo.modules.kotlin.types.map

object StructuredPostalLabelMapper {
  fun toDomain(label: String?): StructuredPostalLabel {
    if (label.isNullOrBlank()) {
      return StructuredPostalLabel.Unknown
    }

    return when (label.lowercase()) {
      "home" -> StructuredPostalLabel.Home
      "work" -> StructuredPostalLabel.Work
      "other" -> StructuredPostalLabel.Other
      else -> StructuredPostalLabel.Custom(label)
    }
  }

  fun toDomain(label: ValueOrUndefined<String?>): ValueOrUndefined<StructuredPostalLabel> {
    return label.map { toDomain(it) }
  }

  fun toRecord(label: StructuredPostalLabel): String? {
    return when (label) {
      is StructuredPostalLabel.Home -> "home"
      is StructuredPostalLabel.Work -> "work"
      is StructuredPostalLabel.Other -> "other"
      is StructuredPostalLabel.Custom -> label.label
      is StructuredPostalLabel.Unknown -> "unknown"
    }
  }
}
