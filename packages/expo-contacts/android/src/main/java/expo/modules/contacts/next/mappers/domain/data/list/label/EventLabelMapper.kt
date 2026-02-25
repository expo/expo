package expo.modules.contacts.next.mappers.domain.data.list.label

import expo.modules.contacts.next.domain.model.event.EventLabel
import expo.modules.kotlin.types.ValueOrUndefined
import expo.modules.kotlin.types.map

object EventLabelMapper {
  fun toDomain(label: String?): EventLabel {
    if (label.isNullOrBlank()) {
      return EventLabel.Custom("other")
    }

    return when (label.lowercase()) {
      "anniversary" -> EventLabel.Anniversary
      "birthday" -> EventLabel.Birthday
      "other" -> EventLabel.Other
      else -> EventLabel.Custom(label)
    }
  }

  fun toDomain(label: ValueOrUndefined<String?>): ValueOrUndefined<EventLabel> {
    return label
      .map { toDomain(it) }
  }

  fun toRecord(label: EventLabel): String? {
    return when (label) {
      is EventLabel.Anniversary -> "anniversary"
      is EventLabel.Birthday -> "birthday"
      is EventLabel.Other -> "other"
      is EventLabel.Custom -> label.label
    }
  }
}
