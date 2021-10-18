package expo.modules.contacts.models

import android.os.Bundle
import android.text.TextUtils
import android.database.Cursor
import android.content.ContentValues
import android.provider.ContactsContract
import android.content.ContentProviderOperation

import expo.modules.contacts.CommonProvider
import expo.modules.contacts.EXColumns

open class BaseModel internal constructor() : CommonProvider {
  internal val map = Bundle()

  open fun mapStringToType(label: String?) = 0

  protected fun mapValue(readableMap: Map<String, Any?>, key: String?, alias: String? = null) {
    if (key in readableMap) {
      val value = readableMap[key]
      if (value is Boolean) {
        map.putBoolean(alias ?: key, value)
      } else {
        map.putString(alias ?: key, value as String)
      }
    }
  }

  open fun fromCursor(cursor: Cursor) {
    putString(cursor, idAlias, EXColumns.ID)
    map.putString(labelAlias, getLabelFromCursor(cursor))
    putString(cursor, dataAlias, EXColumns.DATA)
    putString(cursor, EXColumns.LABEL, EXColumns.LABEL)
    putString(cursor, typeAlias, EXColumns.TYPE)
    putInt(cursor, isPrimaryAlias, EXColumns.IS_PRIMARY)
  }

  val insertOperation: ContentProviderOperation
    get() = getInsertOperation(null)

  open fun getInsertOperation(rawId: String?): ContentProviderOperation {
    val op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
    if (rawId == null) {
      op.withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
    } else {
      op.withValue(ContactsContract.Data.RAW_CONTACT_ID, rawId)
    }
    return op.withValue(EXColumns.MIMETYPE, contentType)
        .withValue(EXColumns.TYPE, mapStringToType(label))
        .withValue(EXColumns.DATA, data)
        .withValue(EXColumns.ID, id)
        .build()
  }

  fun getDeleteOperation(rawId: String?) =
    ContentProviderOperation.newDelete(ContactsContract.Data.CONTENT_URI)
    .withSelection(
        String.format("%s=? AND %s=?",
            ContactsContract.Data.MIMETYPE,
            ContactsContract.Data.RAW_CONTACT_ID),
        arrayOf(contentType, rawId)
    ).build()

  val id: String?
    get() = getString(idAlias)
  val label: String?
    get() = getString(labelAlias)
  val data: String?
    get() = getString(dataAlias)
  val type: String?
    get() = getString(typeAlias)
  val isPrimary: Int
    get() = if (map.containsKey(isPrimaryAlias)) map.getInt(isPrimaryAlias) else 0

  open fun getString(key: String?) =
    if (map.containsKey(key)) map.getString(key) else null

  open fun fromMap(readableMap: Map<String, Any?>) {
    readableMap.keys.forEach {key -> mapValue(readableMap, key) }
  }

  protected open fun getLabelFromCursor(cursor: Cursor): String? =
    when (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
      EXColumns.TYPE_CUSTOM -> cursor.getString(cursor.getColumnIndex(EXColumns.LABEL)) ?: "unknown"
      else -> null
    }

  protected fun putString(cursor: Cursor, key: String?, androidKey: String?) {
    val index = cursor.getColumnIndex(androidKey)
    if (index == -1) {
      //TODO:Bacon: Log instances
      return
    }
    val value = cursor.getString(index)
    if (!TextUtils.isEmpty(value)) map.putString(key, value)
  }

  protected fun putInt(cursor: Cursor, key: String?, androidKey: String?) {
    val index = cursor.getColumnIndex(androidKey)
    if (index == -1) {
      //TODO:Bacon: Log instances
      return
    }
    val value = cursor.getInt(index)
    map.putInt(key, value)
  }

  open val contentValues: ContentValues
    get() {
      val values = ContentValues()
      values.put(EXColumns.MIMETYPE, contentType)
      values.put(EXColumns.DATA, data)
      values.put(EXColumns.TYPE, type)
      values.put(EXColumns.LABEL, label)
      values.put(EXColumns.ID, id)
      values.put(EXColumns.IS_PRIMARY, isPrimary)
      return values
    }

  override val contentType: String?
    get() = null

  override val labelAlias: String
    get() = "label"

  override val dataAlias: String
    get() = EXColumns.DATA

  override val idAlias: String
    get() = "id"

  val isPrimaryAlias: String
    get() = "isPrimary"

  val typeAlias: String
    get() = "type"

  companion object {
    @Throws(IllegalAccessException::class, InstantiationException::class)
    fun decodeList(input: List<*>?, clazz: Class<*>): ArrayList<BaseModel>? {
      if (input == null) return null
      val output = ArrayList<BaseModel>()
      input.forEach {
        val item = clazz.newInstance() as BaseModel
        item.fromMap(it as Map<String, Any?>)
        output.add(item)
      }
      return output
    }
  }
}
