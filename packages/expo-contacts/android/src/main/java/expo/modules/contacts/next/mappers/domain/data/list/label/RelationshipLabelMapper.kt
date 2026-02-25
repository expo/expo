package expo.modules.contacts.next.mappers.domain.data.list.label

import expo.modules.contacts.next.domain.model.relationship.RelationLabel
import expo.modules.kotlin.types.ValueOrUndefined
import expo.modules.kotlin.types.map

object RelationshipLabelMapper {
  fun toDomain(label: String?): RelationLabel {
    if (label.isNullOrBlank()) {
      return RelationLabel.Custom("other")
    }

    return when (label.lowercase()) {
      "assistant" -> RelationLabel.Assistant
      "brother" -> RelationLabel.Brother
      "child" -> RelationLabel.Child
      "domesticpartner" -> RelationLabel.DomesticPartner
      "father" -> RelationLabel.Father
      "friend" -> RelationLabel.Friend
      "manager" -> RelationLabel.Manager
      "mother" -> RelationLabel.Mother
      "parent" -> RelationLabel.Parent
      "partner" -> RelationLabel.Partner
      "referredby" -> RelationLabel.ReferredBy
      "relative" -> RelationLabel.Relative
      "sister" -> RelationLabel.Sister
      "spouse" -> RelationLabel.Spouse
      else -> RelationLabel.Custom(label)
    }
  }

  fun toDomain(label: ValueOrUndefined<String?>): ValueOrUndefined<RelationLabel> {
    return label.map { toDomain(it) }
  }

  fun toRecord(label: RelationLabel): String? {
    return when (label) {
      is RelationLabel.Assistant -> "assistant"
      is RelationLabel.Brother -> "brother"
      is RelationLabel.Child -> "child"
      is RelationLabel.DomesticPartner -> "domesticpartner"
      is RelationLabel.Father -> "father"
      is RelationLabel.Friend -> "friend"
      is RelationLabel.Manager -> "manager"
      is RelationLabel.Mother -> "mother"
      is RelationLabel.Parent -> "parent"
      is RelationLabel.Partner -> "partner"
      is RelationLabel.ReferredBy -> "referredby"
      is RelationLabel.Relative -> "relative"
      is RelationLabel.Sister -> "sister"
      is RelationLabel.Spouse -> "spouse"
      is RelationLabel.Custom -> label.label
    }
  }
}
