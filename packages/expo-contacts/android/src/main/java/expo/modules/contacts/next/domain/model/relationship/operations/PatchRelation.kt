package expo.modules.contacts.next.domain.model.relationship.operations

import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.Relation
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.relationship.RelationLabel
import expo.modules.contacts.next.domain.model.relationship.RelationModel
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.kotlin.types.ValueOrUndefined

class PatchRelation(
  override val dataId: DataId,
  name: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  label: ValueOrUndefined<RelationLabel> = ValueOrUndefined.Undefined()
) : RelationModel(name.optional, label.optional ?: RelationLabel.Custom("")), Updatable.Data {
  override val contentValues = ContentValues().apply {
    if (!name.isUndefined) {
      put(Relation.NAME, name.optional)
    }
    if (!label.isUndefined) {
      put(Relation.TYPE, label.optional?.type)
      put(Relation.LABEL, label.optional?.label)
    }
  }
}
