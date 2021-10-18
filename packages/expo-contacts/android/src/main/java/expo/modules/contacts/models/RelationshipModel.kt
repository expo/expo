package expo.modules.contacts.models

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds

import expo.modules.contacts.EXColumns

class RelationshipModel : BaseModel() {
  override val contentType = CommonDataKinds.Relation.CONTENT_ITEM_TYPE

  override val dataAlias = "name"

  override fun getLabelFromCursor(cursor: Cursor) = super.getLabelFromCursor(cursor)
    ?: when (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
      CommonDataKinds.Relation.TYPE_ASSISTANT -> "assistant"
      CommonDataKinds.Relation.TYPE_BROTHER -> "bother"
      CommonDataKinds.Relation.TYPE_CHILD -> "child"
      CommonDataKinds.Relation.TYPE_DOMESTIC_PARTNER -> "domesticPartner"
      CommonDataKinds.Relation.TYPE_FATHER -> "father"
      CommonDataKinds.Relation.TYPE_FRIEND -> "friend"
      CommonDataKinds.Relation.TYPE_MANAGER -> "manager"
      CommonDataKinds.Relation.TYPE_MOTHER -> "mother"
      CommonDataKinds.Relation.TYPE_PARENT -> "parent"
      CommonDataKinds.Relation.TYPE_PARTNER -> "partner"
      CommonDataKinds.Relation.TYPE_REFERRED_BY -> "referredBy"
      CommonDataKinds.Relation.TYPE_RELATIVE -> "relative"
      CommonDataKinds.Relation.TYPE_SISTER -> "sister"
      CommonDataKinds.Relation.TYPE_SPOUSE -> "spouse"
      else -> "unknown"
    }
}
