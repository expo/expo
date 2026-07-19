package expo.modules.contacts.models

import android.content.ContentProviderOperation
import android.content.ContentValues
import android.database.Cursor
import android.os.Bundle
import android.provider.ContactsContract
import android.text.TextUtils
import expo.modules.contacts.CommonProvider
import expo.modules.contacts.Columns

abstract class BaseModel : CommonProvider {
  val map: Bundle = Bundle()

  override val dataAlias: String = Columns.DATA
  override val labelAlias: String = "label"
  override val idAlias: String = "id"

  open fun mapStringToType(label: String?): Int {
    return 0
  }

  protected fun mapValue(readableMap: Map<String, Any?>, key: String?, alias: String? = null) {
    if (readableMap.containsKey(key)) {
      when (val value = readableMap[key]) {
        is Boolean -> {
          map.putBoolean(alias ?: key, value)
        }
        is String -> {
          map.putString(alias ?: key, value)
        }
        is Double -> {
          map.putDouble(alias ?: key, value)
        }
      }
    }
  }

  open fun fromCursor(cursor: Cursor) {
    putString(cursor, idAlias, Columns.ID)
    map.putString(labelAlias, getLabelFromCursor(cursor))
    putString(cursor, dataAlias, Columns.DATA)
    putString(cursor, Columns.LABEL, Columns.LABEL)
    putString(cursor, typeAlias, Columns.TYPE)
    putInt(cursor, isPrimaryAlias, Columns.IS_PRIMARY)
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
    return op.withValue(Columns.MIMETYPE, contentType)
      .withValue(Columns.TYPE, mapStringToType(label))
      .withValue(Columns.DATA, data)
      .withValue(Columns.ID, id)
      .build()
  }

  fun getDeleteOperation(rawId: String): ContentProviderOperation {
    return ContentProviderOperation.newDelete(ContactsContract.Data.CONTENT_URI)
      .withSelection(String.format("%s=? AND %s=?", ContactsContract.Data.MIMETYPE, ContactsContract.Data.RAW_CONTACT_ID), arrayOf<String>(contentType, rawId))
      .build()
  }

  private val id: String?
    get() = getString(idAlias)
  val label: String?
    get() = getString(labelAlias)
  val data: String?
    get() = getString(dataAlias)
  val type: String?
    get() = getString(typeAlias)

  private val isPrimary: Int
    get() = if (map.containsKey(isPrimaryAlias)) if (map.getBoolean(isPrimaryAlias)) 1 else 0 else 0

  fun getString(key: String?): String? {
    return if (map.containsKey(key)) map.getString(key) else null
  }

  open fun fromMap(readableMap: Map<String, Any?>) {
    for (key in readableMap.keys) {
      mapValue(readableMap, key)
    }
  }

  protected open fun getLabelFromCursor(cursor: Cursor): String? {
    if (cursor.getInt(cursor.getColumnIndexOrThrow(Columns.TYPE)) == Columns.TYPE_CUSTOM) {
      val label = cursor.getString(cursor.getColumnIndexOrThrow(Columns.LABEL))
      return label ?: "unknown"
    }
    return null
  }

  protected fun putString(cursor: Cursor, key: String?, androidKey: String?) {
    val index = cursor.getColumnIndex(androidKey)
    if (index == -1) {
      // TODO:Bacon: Log instances
      return
    }
    val value = cursor.getString(index)
    if (!TextUtils.isEmpty(value)) map.putString(key, value)
  }

  private fun putInt(cursor: Cursor, key: String?, androidKey: String?) {
    val index = cursor.getColumnIndex(androidKey)
    if (index == -1) {
      // TODO:Bacon: Log instances
      return
    }
    val value = cursor.getInt(index)
    map.putInt(key, value)
  }

  open val contentValues: ContentValues
    get() {
      return ContentValues().apply {
        put(Columns.MIMETYPE, contentType)
        put(Columns.DATA, data)
        put(Columns.TYPE, mapStringToType(label))
        put(Columns.LABEL, label)
        put(Columns.ID, id)
        put(Columns.IS_PRIMARY, isPrimary)
      }
    }

  private val typeAlias: String = "type"
  private val isPrimaryAlias: String
    get() = "isPrimary"

  companion object {
    @Throws(IllegalAccessException::class, InstantiationException::class)
    fun <T : BaseModel> decodeList(input: List<Map<String, Any?>>?, clazz: Class<T>): MutableList<T>? {
      if (input == null) {
        return null
      }

      return input.map {
        val item = clazz.getDeclaredConstructor().newInstance()
        item.fromMap(it)
        item
      }.toMutableList()
    }
  }
}
