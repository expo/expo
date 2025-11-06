package expo.modules.contacts.next.domain.model.relationship

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds.Relation
import expo.modules.contacts.next.domain.model.ClearableField
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.relationship.operations.ExistingRelation
import expo.modules.contacts.next.domain.wrappers.DataId

object RelationField : ExtractableField<ExistingRelation>, ClearableField {
  override val projection = arrayOf(Relation._ID, Relation.NAME, Relation.TYPE, Relation.LABEL)

  override val mimeType = Relation.CONTENT_ITEM_TYPE

  override fun extract(cursor: Cursor): ExistingRelation = with(cursor) {
    return ExistingRelation(
      dataId = DataId(getString(getColumnIndexOrThrow(DataId.COLUMN_IN_DATA_TABLE))),
      name = getString(getColumnIndexOrThrow(Relation.NAME)),
      label = extractLabel()
    )
  }

  private fun Cursor.extractLabel() =
    when (getInt(getColumnIndexOrThrow(Relation.TYPE))) {
      Relation.TYPE_ASSISTANT -> RelationLabel.Assistant
      Relation.TYPE_BROTHER -> RelationLabel.Brother
      Relation.TYPE_CHILD -> RelationLabel.Child
      Relation.TYPE_DOMESTIC_PARTNER -> RelationLabel.DomesticPartner
      Relation.TYPE_FATHER -> RelationLabel.Father
      Relation.TYPE_FRIEND -> RelationLabel.Friend
      Relation.TYPE_MANAGER -> RelationLabel.Manager
      Relation.TYPE_MOTHER -> RelationLabel.Mother
      Relation.TYPE_PARENT -> RelationLabel.Parent
      Relation.TYPE_PARTNER -> RelationLabel.Partner
      Relation.TYPE_REFERRED_BY -> RelationLabel.ReferredBy
      Relation.TYPE_RELATIVE -> RelationLabel.Relative
      Relation.TYPE_SISTER -> RelationLabel.Sister
      Relation.TYPE_SPOUSE -> RelationLabel.Spouse
      Relation.TYPE_CUSTOM -> {
        val customLabel = getString(getColumnIndexOrThrow(Relation.LABEL))
        RelationLabel.Custom(customLabel)
      }
      else -> RelationLabel.Unknown
    }
}
