package expo.modules.contacts.next.domain.model.relationship

import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.Relation

abstract class RelationModel(
  val name: String?,
  val label: RelationLabel
) {
  val mimeType = Relation.CONTENT_ITEM_TYPE
  open val contentValues =
    ContentValues().apply {
      put(Relation.NAME, name)
      put(Relation.TYPE, label.type)
      put(Relation.LABEL, label.label)
    }
}
