package expo.modules.medialibrary.next.objects.query

import android.content.Context
import android.os.Build
import android.provider.MediaStore
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.medialibrary.next.exceptions.ContentResolverNotObtainedException
import expo.modules.medialibrary.next.extensions.asIterable
import expo.modules.medialibrary.next.extensions.getOrThrow
import expo.modules.medialibrary.next.extensions.resolver.extractAssetContentUri
import expo.modules.medialibrary.next.objects.album.Album
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.query.builder.QueryLegacyExecutor
import expo.modules.medialibrary.next.objects.query.builder.QueryModernExecutor
import expo.modules.medialibrary.next.records.AssetField
import expo.modules.medialibrary.next.records.SortDescriptor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.lang.ref.WeakReference
import kotlin.collections.joinToString

class Query(context: Context) : SharedObject() {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef
      .getOrThrow()
      .contentResolver ?: throw ContentResolverNotObtainedException()

  private val clauses = mutableListOf<String>()
  private val args = mutableListOf<String>()
  private val orderBy = mutableListOf<SortDescriptor>()

  private var album: Album? = null
  private var limit: Int? = null
  private var offset: Int? = null

  fun eq(field: AssetField, value: String): Query {
    clauses.add("${field.toMediaStoreColumn()} = ?")
    args.add(value)
    return this
  }

  fun `in`(field: AssetField, values: List<String>): Query {
    val questionMarks = values.joinToString(", ") { "?" }
    clauses.add("${field.toMediaStoreColumn()} IN ($questionMarks)")
    args.addAll(values)
    return this
  }

  fun gt(field: AssetField, value: String): Query {
    clauses.add("${field.toMediaStoreColumn()} > ?")
    args.add(value)
    return this
  }

  fun gte(field: AssetField, value: String): Query {
    clauses.add("${field.toMediaStoreColumn()} >= ?")
    args.add(value)
    return this
  }

  fun lt(field: AssetField, value: String): Query {
    clauses.add("${field.toMediaStoreColumn()} < ?")
    args.add(value)
    return this
  }

  fun lte(field: AssetField, value: String): Query {
    clauses.add("${field.toMediaStoreColumn()} <= ?")
    args.add(value)
    return this
  }

  fun limit(limit: Int): Query {
    this.limit = limit
    return this
  }

  fun album(album: Album): Query {
    this.album = album
    return this
  }

  fun offset(count: Int): Query {
    this.offset = count
    return this
  }

  fun orderBy(descriptor: SortDescriptor): Query {
    orderBy.add(descriptor)
    return this
  }

  suspend fun exe(): List<Asset> = withContext(Dispatchers.IO) {
    val queryExecutor = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      QueryModernExecutor(clauses, args, orderBy, album, limit, offset)
    } else {
      QueryLegacyExecutor(clauses, args, orderBy, album, limit, offset)
    }
    val projection = arrayOf(
      MediaStore.Files.FileColumns._ID,
      MediaStore.Files.FileColumns.MEDIA_TYPE
    )

    val cursor = queryExecutor.exe(projection, contentResolver)
    return@withContext cursor.use {
      ensureActive()
      val idColumn = it.getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID)
      val typeColumn = it.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MEDIA_TYPE)
      it.asIterable()
        .map { row -> row.extractAssetContentUri(idColumn, typeColumn) }
        .map { uri -> Asset(uri, contextRef.getOrThrow()) }
        .toList()
    }
  }
}
