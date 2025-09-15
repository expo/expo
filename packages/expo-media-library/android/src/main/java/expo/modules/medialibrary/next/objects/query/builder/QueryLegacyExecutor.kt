package expo.modules.medialibrary.next.objects.query.builder

import android.content.ContentResolver
import android.database.Cursor
import android.os.Build
import android.provider.MediaStore
import androidx.annotation.DeprecatedSinceApi
import expo.modules.medialibrary.next.exceptions.QueryCouldNotBeExecuted
import expo.modules.medialibrary.next.extensions.resolver.EXTERNAL_CONTENT_URI
import expo.modules.medialibrary.next.records.SortDescriptor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@DeprecatedSinceApi(Build.VERSION_CODES.Q)
class QueryLegacyExecutor(
  private val clauses: MutableList<String>,
  private val args: MutableList<String>,
  private val sortDescriptors: MutableList<SortDescriptor>,
  private val limit: Int?,
  private val offset: Int?
) : QueryExecutor {
  override suspend fun exe(
    projection: Array<String>,
    contentResolver: ContentResolver
  ): Cursor = withContext(Dispatchers.IO) {
    val selection = buildSelection()
    val sortOrder = buildSortOrder()
    val selectionArgs = args.toTypedArray()
    return@withContext contentResolver.query(EXTERNAL_CONTENT_URI, projection, selection, selectionArgs, sortOrder)
      ?: throw QueryCouldNotBeExecuted("Cursor is null")
  }

  private fun buildSortOrder(): String {
    var sortOrder = buildOrderBy()
    sortOrder = addLimit(sortOrder)
    return addOffset(sortOrder)
  }

  private fun buildSelection(): String {
    return clauses.joinToString(" AND ")
  }

  private fun buildOrderBy(): String? {
    return if (!sortDescriptors.isEmpty()) {
      sortDescriptors.joinToString(", ") { it.toMediaStoreQueryString() }
    } else {
      null
    }
  }

  private fun addLimit(sortOrder: String?): String {
    return if (limit != null) {
      requireNotEmptySortOrder(sortOrder) + " LIMIT $limit"
    } else if (offset != null) {
      // SQLITE: limit is required to perform offset
      requireNotEmptySortOrder(sortOrder) + " LIMIT -1"
    } else {
      sortOrder ?: ""
    }
  }

  private fun requireNotEmptySortOrder(sortOrder: String?): String {
    return sortOrder ?: MediaStore.Files.FileColumns._ID
  }

  private fun addOffset(orderBy: String): String {
    return if (offset != null) {
      "$orderBy OFFSET $offset"
    } else {
      orderBy
    }
  }
}
