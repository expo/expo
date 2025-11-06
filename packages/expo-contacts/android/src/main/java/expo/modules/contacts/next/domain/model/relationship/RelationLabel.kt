package expo.modules.contacts.next.domain.model.relationship

import android.provider.ContactsContract.CommonDataKinds.Relation

sealed class RelationLabel {
  abstract val type: Int
  abstract val label: String?

  object Assistant : RelationLabel() {
    override val type = Relation.TYPE_ASSISTANT
    override val label = "assistant"
  }

  object Brother : RelationLabel() {
    override val type = Relation.TYPE_BROTHER
    override val label = "brother"
  }

  object Child : RelationLabel() {
    override val type = Relation.TYPE_CHILD
    override val label = "child"
  }

  object DomesticPartner : RelationLabel() {
    override val type = Relation.TYPE_DOMESTIC_PARTNER
    override val label = "domesticPartner"
  }

  object Father : RelationLabel() {
    override val type = Relation.TYPE_FATHER
    override val label = "father"
  }

  object Friend : RelationLabel() {
    override val type = Relation.TYPE_FRIEND
    override val label = "friend"
  }

  object Manager : RelationLabel() {
    override val type = Relation.TYPE_MANAGER
    override val label = "manager"
  }

  object Mother : RelationLabel() {
    override val type = Relation.TYPE_MOTHER
    override val label = "mother"
  }

  object Parent : RelationLabel() {
    override val type = Relation.TYPE_PARENT
    override val label = "parent"
  }

  object Partner : RelationLabel() {
    override val type = Relation.TYPE_PARTNER
    override val label = "partner"
  }

  object ReferredBy : RelationLabel() {
    override val type = Relation.TYPE_REFERRED_BY
    override val label = "referredBy"
  }

  object Relative : RelationLabel() {
    override val type = Relation.TYPE_RELATIVE
    override val label = "relative"
  }

  object Sister : RelationLabel() {
    override val type = Relation.TYPE_SISTER
    override val label = "sister"
  }

  object Spouse : RelationLabel() {
    override val type = Relation.TYPE_SPOUSE
    override val label = "spouse"
  }

  data class Custom(override val label: String) : RelationLabel() {
    override val type = Relation.TYPE_CUSTOM
  }

  object Unknown : RelationLabel() {
    override val type = Relation.TYPE_CUSTOM
    override val label = "unknown"
  }
}
