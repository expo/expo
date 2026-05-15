package expo.modules.medialibrary.next

import android.net.Uri
import android.os.Build
import androidx.core.os.bundleOf
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.toKClass
import expo.modules.medialibrary.next.objects.album.Album
import expo.modules.medialibrary.next.objects.album.AlbumQuery
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.album.factories.AlbumModernFactory
import expo.modules.medialibrary.next.objects.album.factories.AlbumLegacyFactory
import expo.modules.medialibrary.next.objects.asset.deleters.AssetLegacyDeleter
import expo.modules.medialibrary.next.objects.asset.deleters.AssetModernDeleter
import expo.modules.medialibrary.next.objects.asset.factories.AssetModernFactory
import expo.modules.medialibrary.next.objects.asset.factories.AssetLegacyFactory
import expo.modules.medialibrary.next.objects.asset.movers.AssetLegacyMover
import expo.modules.medialibrary.next.objects.asset.movers.AssetModernMover
import expo.modules.medialibrary.next.objects.query.MediaStoreQueryFormatter
import expo.modules.medialibrary.next.objects.query.Query
import expo.modules.medialibrary.next.objects.wrappers.MediaType
import expo.modules.medialibrary.next.permissions.MediaStorePermissionsDelegate
import expo.modules.medialibrary.next.permissions.SystemPermissionsDelegate
import expo.modules.medialibrary.next.permissions.enums.GranularPermission
import expo.modules.medialibrary.next.records.AssetField
import expo.modules.medialibrary.next.observers.MediaStoreObserverManager
import expo.modules.medialibrary.next.records.SortDescriptor

class MediaLibraryNextModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val observerManager by lazy {
    MediaStoreObserverManager(
      context.contentResolver,
      appContext.backgroundCoroutineScope
    ) {
      sendEvent(
        LIBRARY_DID_CHANGE_EVENT,
        bundleOf("hasIncrementalChanges" to false)
      )
    }
  }

  private val systemPermissionsDelegate by lazy {
    SystemPermissionsDelegate(appContext)
  }

  private val mediaStorePermissionsDelegate by lazy {
    MediaStorePermissionsDelegate(appContext)
  }

  private val albumQuery by lazy {
    AlbumQuery(albumFactory, context)
  }

  private val assetMover by lazy {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      AssetModernMover(mediaStorePermissionsDelegate)
    } else {
      AssetLegacyMover()
    }
  }

  private val albumFactory by lazy {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      AlbumModernFactory(assetFactory, assetDeleter, assetMover, context)
    } else {
      AlbumLegacyFactory(assetFactory, assetDeleter, assetMover, context)
    }
  }

  private val assetFactory by lazy {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      AssetModernFactory(assetDeleter, assetMover, mediaStorePermissionsDelegate, context)
    } else {
      AssetLegacyFactory(assetDeleter, assetMover, systemPermissionsDelegate, context)
    }
  }

  private val assetDeleter by lazy {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      AssetModernDeleter(mediaStorePermissionsDelegate)
    } else {
      AssetLegacyDeleter(systemPermissionsDelegate, context)
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoMediaLibraryNext")

    Events(LIBRARY_DID_CHANGE_EVENT)

    OnStartObserving(LIBRARY_DID_CHANGE_EVENT) {
      observerManager.startObserving()
    }

    OnStopObserving(LIBRARY_DID_CHANGE_EVENT) {
      observerManager.stopObserving()
    }

    Class(Asset::class) {
      Constructor { contentUri: Uri ->
        assetFactory.create(contentUri)
      }

      Property("id") { self: Asset ->
        self.contentUri
      }

      AsyncFunction("getCreationTime") Coroutine { self: Asset ->
        self.getCreationTime()
      }

      AsyncFunction("getDuration") Coroutine { self: Asset ->
        self.getDuration()
      }

      AsyncFunction("getExif") Coroutine { self: Asset ->
        self.getExif()
      }

      AsyncFunction("getInfo") Coroutine { self: Asset ->
        self.getInfo()
      }

      AsyncFunction("getAlbums") Coroutine { self: Asset ->
        self.getAlbums()
      }

      AsyncFunction("getLocation") Coroutine { self: Asset ->
        self.getLocation()
      }

      AsyncFunction("getFilename") Coroutine { self: Asset ->
        self.getFilename()
      }

      AsyncFunction("getHeight") Coroutine { self: Asset ->
        self.getHeight()
      }

      AsyncFunction("getMediaType") Coroutine { self: Asset ->
        self.getMediaType()
      }

      AsyncFunction("getModificationTime") Coroutine { self: Asset ->
        self.getModificationTime()
      }

      AsyncFunction("getShape") Coroutine { self: Asset ->
        self.getShape()
      }

      AsyncFunction("getUri") Coroutine { self: Asset ->
        self.getUri()
      }

      AsyncFunction("getWidth") Coroutine { self: Asset ->
        self.getWidth()
      }

      AsyncFunction("delete") Coroutine { self: Asset ->
        self.delete()
      }

      StaticAsyncFunction("create") Coroutine { filePath: Uri, album: Album? ->
        return@Coroutine assetFactory.create(filePath, album?.getRelativePath())
      }

      StaticAsyncFunction("delete") Coroutine { assets: List<Asset> ->
        assetDeleter.delete(assets.map { it.contentUri })
      }
    }

    Class(Album::class) {
      Constructor { id: String ->
        Album(id, assetDeleter, assetFactory, assetMover, context)
      }

      Property("id") { self: Album ->
        self.id
      }

      AsyncFunction("getTitle") Coroutine { self: Album ->
        self.getTitle()
      }

      AsyncFunction("getAssets") Coroutine { self: Album ->
        self.getAssets()
      }

      AsyncFunction("add") Coroutine { self: Album, assets: List<Asset> ->
        self.add(assets)
      }

      AsyncFunction("delete") Coroutine { self: Album ->
        self.delete()
      }

      StaticAsyncFunction("get") Coroutine { title: String ->
        albumQuery.getAlbum(title)
      }

      StaticAsyncFunction("getAll") Coroutine { ->
        albumQuery.getAllAlbums()
      }

      StaticAsyncFunction("delete") Coroutine { albums: List<Album>, deleteAssets: Boolean? ->
        val contentUris = albums
          .map { it.getAssets() }
          .flatten()
          .map { it.contentUri }
        assetDeleter.delete(contentUris)
      }

      StaticAsyncFunction("create") Coroutine { name: String, assetRefs: Either<List<Asset>, List<Uri>>, moveAssets: Boolean? ->
        val assetListKClass = toKClass<List<Asset>>()
        if (assetRefs.`is`(assetListKClass)) {
          val assetList = assetRefs.get(assetListKClass)
          return@Coroutine albumFactory.createFromAssets(name, assetList, moveAssets ?: true)
        }
        val assetPaths = assetRefs.get(toKClass<List<Uri>>())
        return@Coroutine albumFactory.createFromFilePaths(name, assetPaths)
      }
    }

    Class(Query::class) {
      Constructor {
        Query(assetFactory, context)
      }

      Function("limit") { self: Query, limit: Int ->
        self.limit(limit)
      }

      Function("offset") { self: Query, offset: Int ->
        self.offset(offset)
      }

      Function("album") { self: Query, album: Album ->
        self.album(album)
      }

      Function("eq") { self: Query, field: AssetField, value: Either<MediaType, Long> ->
        self.eq(field, MediaStoreQueryFormatter.parse(field, value))
      }

      Function("within") { self: Query, field: AssetField, values: List<Either<MediaType, Long>> ->
        val stringValues = values.map { value -> MediaStoreQueryFormatter.parse(field, value) }
        self.within(field, stringValues)
      }

      Function("gt") { self: Query, field: AssetField, value: Long ->
        self.gt(field, MediaStoreQueryFormatter.parse(field, value))
      }

      Function("gte") { self: Query, field: AssetField, value: Long ->
        self.gte(field, MediaStoreQueryFormatter.parse(field, value))
      }

      Function("lt") { self: Query, field: AssetField, value: Long ->
        self.lt(field, MediaStoreQueryFormatter.parse(field, value))
      }

      Function("lte") { self: Query, field: AssetField, value: Long ->
        self.lte(field, MediaStoreQueryFormatter.parse(field, value))
      }

      Function("orderBy") { self: Query, sortDescriptorRef: Either<AssetField, SortDescriptor> ->
        if (sortDescriptorRef.`is`(AssetField::class)) {
          val assetField = sortDescriptorRef.get(AssetField::class)
          val descriptor = SortDescriptor(assetField)
          return@Function self.orderBy(descriptor)
        }
        val descriptor = sortDescriptorRef.get(SortDescriptor::class)
        return@Function self.orderBy(descriptor)
      }

      AsyncFunction("exe") Coroutine { self: Query ->
        return@Coroutine self.exe()
      }
    }

    AsyncFunction("requestPermissionsAsync") { writeOnly: Boolean?, permissions: List<GranularPermission>?, promise: Promise ->
      systemPermissionsDelegate.requestPermissions(writeOnly ?: false, permissions, promise)
    }

    AsyncFunction("getPermissionsAsync") { writeOnly: Boolean?, permissions: List<GranularPermission>?, promise: Promise ->
      systemPermissionsDelegate.getPermissions(writeOnly ?: false, permissions, promise)
    }

    AsyncFunction("presentPermissionsPicker") { permissions: List<GranularPermission>?, promise: Promise ->
      systemPermissionsDelegate.presentPermissionsPicker(permissions, promise)
    }

    RegisterActivityContracts {
      with(mediaStorePermissionsDelegate) {
        registerMediaStoreContracts(this@MediaLibraryNextModule)
      }
    }
  }

  companion object {
    const val LIBRARY_DID_CHANGE_EVENT = "mediaLibraryDidChange"
  }
}
