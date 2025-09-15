package expo.modules.medialibrary.next.objects.query.builder

import android.content.ContentResolver
import android.content.ContentResolver.QUERY_ARG_LIMIT
import android.content.ContentResolver.QUERY_ARG_OFFSET
import android.content.ContentResolver.QUERY_ARG_SQL_SELECTION
import android.content.ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS
import android.content.ContentResolver.QUERY_ARG_SQL_SORT_ORDER
import android.database.Cursor
import android.os.Build
import android.os.Bundle
import androidx.annotation.RequiresApi
import expo.modules.medialibrary.next.exceptions.QueryCouldNotBeExecuted
import expo.modules.medialibrary.next.extensions.resolver.EXTERNAL_CONTENT_URI
import expo.modules.medialibrary.next.records.SortDescriptor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@RequiresApi(Build.VERSION_CODES.R)
class QueryModernExecutor(
  private var clauses: MutableList<String>,
  private var args: MutableList<String>,
  private val sortDescriptors: MutableList<SortDescriptor>,
  private val limit: Int?,
  private val offset: Int?
) : QueryExecutor {
  override suspend fun exe(
    projection: Array<String>,
    contentResolver: ContentResolver
  ): Cursor = withContext(Dispatchers.IO) {
    val queryArgs = build()
    return@withContext contentResolver.query(EXTERNAL_CONTENT_URI, projection, queryArgs, null)
      ?: throw QueryCouldNotBeExecuted("Cursor is null")
  }

  private fun build(): Bundle {
    val selection = buildSelection()
    val selectionArgs = args.toTypedArray()
    val sortOrder = buildSortOrder()
    return Bundle().apply {
      limit?.let { putInt(QUERY_ARG_LIMIT, it) }
      offset?.let {
        // SQLITE: limit is required to perform offset
        if (limit == null) {
          putInt(QUERY_ARG_LIMIT, -1)
        }
        putInt(QUERY_ARG_OFFSET, it)
      }
      selection?.let {
        putString(QUERY_ARG_SQL_SELECTION, it)
        putStringArray(QUERY_ARG_SQL_SELECTION_ARGS, selectionArgs)
      }
      sortOrder?.let {
        putString(QUERY_ARG_SQL_SORT_ORDER, it)
      }
    }
  }

  private fun buildSelection(): String? {
    if (clauses.isEmpty()) {
      return null
    }
    return clauses.joinToString(" AND ")
  }

  private fun buildSortOrder(): String? {
    if (sortDescriptors.isEmpty()) {
      return null
    }
    return sortDescriptors.joinToString(", ") { it.toMediaStoreQueryString() }
  }
}
