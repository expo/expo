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

  fun eq(field: AssetField, value: String) = apply {
    clauses.add("${field.toMediaStoreColumn()} = ?")
    args.add(value)
  }

  fun within(field: AssetField, values: List<String>) = apply {
    val questionMarks = values.joinToString(", ") { "?" }
    clauses.add("${field.toMediaStoreColumn()} IN ($questionMarks)")
    args.addAll(values)
  }

  fun gt(field: AssetField, value: String) = apply {
    clauses.add("${field.toMediaStoreColumn()} > ?")
    args.add(value)
  }

  fun gte(field: AssetField, value: String) = apply {
    clauses.add("${field.toMediaStoreColumn()} >= ?")
    args.add(value)
  }

  fun lt(field: AssetField, value: String) = apply {
    clauses.add("${field.toMediaStoreColumn()} < ?")
    args.add(value)
  }

  fun lte(field: AssetField, value: String) = apply {
    clauses.add("${field.toMediaStoreColumn()} <= ?")
    args.add(value)
  }

  fun limit(limit: Int) = apply {
    this.limit = limit
  }

  fun album(album: Album) = apply {
    clauses.add("${MediaStore.MediaColumns.BUCKET_ID} = ?")
    args.add(album.id)
  }

  fun offset(count: Int) = apply {
    this.offset = count
  }

  fun orderBy(descriptor: SortDescriptor) = apply {
    orderBy.add(descriptor)
  }

  suspend fun exe(): List<Asset> = withContext(Dispatchers.IO) {
    val queryExecutor = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      QueryModernExecutor(clauses, args, orderBy, limit, offset)
    } else {
      QueryLegacyExecutor(clauses, args, orderBy, limit, offset)
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
