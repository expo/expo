package expo.modules.contacts.next.domain.model.relationship

import android.provider.ContactsContract.CommonDataKinds.Relation

sealed class RelationLabel {
  abstract val type: Int
  open val label: String? = null

  object Assistant : RelationLabel() {
    override val type = Relation.TYPE_ASSISTANT
  }

  object Brother : RelationLabel() {
    override val type = Relation.TYPE_BROTHER
  }

  object Child : RelationLabel() {
    override val type = Relation.TYPE_CHILD
  }

  object DomesticPartner : RelationLabel() {
    override val type = Relation.TYPE_DOMESTIC_PARTNER
  }

  object Father : RelationLabel() {
    override val type = Relation.TYPE_FATHER
  }

  object Friend : RelationLabel() {
    override val type = Relation.TYPE_FRIEND
  }

  object Manager : RelationLabel() {
    override val type = Relation.TYPE_MANAGER
  }

  object Mother : RelationLabel() {
    override val type = Relation.TYPE_MOTHER
  }

  object Parent : RelationLabel() {
    override val type = Relation.TYPE_PARENT
  }

  object Partner : RelationLabel() {
    override val type = Relation.TYPE_PARTNER
  }

  object ReferredBy : RelationLabel() {
    override val type = Relation.TYPE_REFERRED_BY
  }

  object Relative : RelationLabel() {
    override val type = Relation.TYPE_RELATIVE
  }

  object Sister : RelationLabel() {
    override val type = Relation.TYPE_SISTER
  }

  object Spouse : RelationLabel() {
    override val type = Relation.TYPE_SPOUSE
  }

  data class Custom(override val label: String) : RelationLabel() {
    override val type = Relation.TYPE_CUSTOM
  }
}
