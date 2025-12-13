package expo.modules.contacts.next.domain.model.relationship

import android.provider.ContactsContract.CommonDataKinds.Relation

sealed class RelationLabel(val type: Int, val label: String? = null) {
  object Assistant : RelationLabel(Relation.TYPE_ASSISTANT)
  object Brother : RelationLabel(Relation.TYPE_BROTHER)
  object Child : RelationLabel(Relation.TYPE_CHILD)
  object DomesticPartner : RelationLabel(Relation.TYPE_DOMESTIC_PARTNER)
  object Father : RelationLabel(Relation.TYPE_FATHER)
  object Friend : RelationLabel(Relation.TYPE_FRIEND)
  object Manager : RelationLabel(Relation.TYPE_MANAGER)
  object Mother : RelationLabel(Relation.TYPE_MOTHER)
  object Parent : RelationLabel(Relation.TYPE_PARENT)
  object Partner : RelationLabel(Relation.TYPE_PARTNER)
  object ReferredBy : RelationLabel(Relation.TYPE_REFERRED_BY)
  object Relative : RelationLabel(Relation.TYPE_RELATIVE)
  object Sister : RelationLabel(Relation.TYPE_SISTER)
  object Spouse : RelationLabel(Relation.TYPE_SPOUSE)
  class Custom(label: String) : RelationLabel(Relation.TYPE_CUSTOM, label)
}
