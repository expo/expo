package expo.modules.medialibrary.next

import android.net.Uri
import android.os.Build
import expo.modules.kotlin.Promise
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.toKClass
import expo.modules.medialibrary.next.objects.album.Album
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.album.factories.AlbumModernFactory
import expo.modules.medialibrary.next.objects.album.factories.AlbumLegacyFactory
import expo.modules.medialibrary.next.objects.asset.factories.AssetModernFactory
import expo.modules.medialibrary.next.objects.asset.factories.AssetLegacyFactory
import expo.modules.medialibrary.next.objects.query.MediaStoreQueryFormatter
import expo.modules.medialibrary.next.objects.query.Query
import expo.modules.medialibrary.next.objects.wrappers.MediaType
import expo.modules.medialibrary.next.permissions.MediaStorePermissionsDelegate
import expo.modules.medialibrary.next.permissions.SystemPermissionsDelegate
import expo.modules.medialibrary.next.permissions.enums.GranularPermission
import expo.modules.medialibrary.next.records.AssetField
import expo.modules.medialibrary.next.records.SortDescriptor

@OptIn(EitherType::class)
class MediaLibraryNextModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val systemPermissionsDelegate by lazy {
    SystemPermissionsDelegate(appContext)
  }

  private val mediaStorePermissionsDelegate by lazy {
    MediaStorePermissionsDelegate(appContext)
  }

  private val albumFactory by lazy {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      AlbumModernFactory(assetFactory, context)
    } else {
      AlbumLegacyFactory(assetFactory, context)
    }
  }

  private val assetFactory by lazy {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      AssetModernFactory(context)
    } else {
      AssetLegacyFactory(context)
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoMediaLibraryNext")

    Class(Asset::class) {
      Constructor { contentUri: Uri ->
        Asset(contentUri, context)
      }

      Property("id") { self: Asset ->
        systemPermissionsDelegate.requireSystemPermissions(false)
        self.contentUri
      }

      AsyncFunction("getCreationTime") Coroutine { self: Asset ->
        systemPermissionsDelegate.requireSystemPermissions(false)
        self.getCreationTime()
      }

      AsyncFunction("getDuration") Coroutine { self: Asset ->
        systemPermissionsDelegate.requireSystemPermissions(false)
        self.getDuration()
      }

      AsyncFunction("getFilename") Coroutine { self: Asset ->
        systemPermissionsDelegate.requireSystemPermissions(false)
        self.getFilename()
      }

      AsyncFunction("getHeight") Coroutine { self: Asset ->
        systemPermissionsDelegate.requireSystemPermissions(false)
        self.getHeight()
      }

      AsyncFunction("getMediaType") Coroutine { self: Asset ->
        systemPermissionsDelegate.requireSystemPermissions(false)
        self.getMediaType()
      }

      AsyncFunction("getModificationTime") Coroutine { self: Asset ->
        systemPermissionsDelegate.requireSystemPermissions(false)
        self.getModificationTime()
      }

      AsyncFunction("getUri") Coroutine { self: Asset ->
        systemPermissionsDelegate.requireSystemPermissions(false)
        self.getUri()
      }

      AsyncFunction("getWidth") Coroutine { self: Asset ->
        systemPermissionsDelegate.requireSystemPermissions(false)
        self.getWidth()
      }

      AsyncFunction("delete") Coroutine { self: Asset ->
        systemPermissionsDelegate.requireSystemPermissions(true)
        mediaStorePermissionsDelegate.requestMediaLibraryActionPermission(listOf(self.contentUri), needsDeletePermission = true)
        self.delete()
      }
    }

    Class(Album::class) {
      Constructor { id: String ->
        Album(id, context)
      }

      Property("id") { self: Album ->
        self.id
      }

      AsyncFunction("getTitle") Coroutine { self: Album ->
        systemPermissionsDelegate.requireSystemPermissions(false)
        self.getTitle()
      }

      AsyncFunction("getAssets") Coroutine { self: Album ->
        systemPermissionsDelegate.requireSystemPermissions(false)
        self.getAssets()
      }

      AsyncFunction("add") Coroutine { self: Album, asset: Asset ->
        systemPermissionsDelegate.requireSystemPermissions(true)
        mediaStorePermissionsDelegate.requestMediaLibraryActionPermission(listOf(asset.contentUri))
        self.add(asset)
      }

      AsyncFunction("delete") Coroutine { self: Album ->
        systemPermissionsDelegate.requireSystemPermissions(true)
        val assetIdsToDelete = self.getAssets().map { it.contentUri }
        mediaStorePermissionsDelegate.requestMediaLibraryActionPermission(assetIdsToDelete, needsDeletePermission = true)
        self.delete()
      }
    }

    Class(Query::class) {
      Constructor {
        Query(context)
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

      Function("eq") { self: Query, field: AssetField, value: Either<MediaType, Int> ->
        self.eq(field, MediaStoreQueryFormatter.parse(value))
      }

      Function("within") { self: Query, field: AssetField, values: List<Either<MediaType, Int>> ->
        val stringValues = values.map { value -> MediaStoreQueryFormatter.parse(value) }
        self.within(field, stringValues)
      }

      Function("gt") { self: Query, field: AssetField, value: Int ->
        self.gt(field, MediaStoreQueryFormatter.parse(value))
      }

      Function("gte") { self: Query, field: AssetField, value: Int ->
        self.gte(field, MediaStoreQueryFormatter.parse(value))
      }

      Function("lt") { self: Query, field: AssetField, value: Int ->
        self.lt(field, MediaStoreQueryFormatter.parse(value))
      }

      Function("lte") { self: Query, field: AssetField, value: Int ->
        self.lte(field, MediaStoreQueryFormatter.parse(value))
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

    AsyncFunction("createAsset") Coroutine { filePath: Uri, album: Album? ->
      systemPermissionsDelegate.requireSystemPermissions(true)
      return@Coroutine assetFactory.create(filePath, album?.getRelativePath())
    }

    @OptIn(EitherType::class)
    AsyncFunction("createAlbum") Coroutine { name: String, assetRefs: Either<List<Asset>, List<Uri>>, move: Boolean ->
      systemPermissionsDelegate.requireSystemPermissions(true)
      val assetListKClass = toKClass<List<Asset>>()
      if (assetRefs.`is`(assetListKClass)) {
        val assetList = assetRefs.get(assetListKClass)
        return@Coroutine albumFactory.createFromAssets(name, assetList, move)
      }
      val assetPaths = assetRefs.get(toKClass<List<Uri>>())
      return@Coroutine albumFactory.createFromFilePaths(name, assetPaths)
    }

    AsyncFunction("deleteAlbums") Coroutine { albums: List<Album> ->
      systemPermissionsDelegate.requireSystemPermissions(true)
      albums.forEach { album -> album.delete() }
    }

    AsyncFunction("deleteAssets") Coroutine { assets: List<Asset> ->
      systemPermissionsDelegate.requireSystemPermissions(true)
      val assetIdsToDelete = assets.map { it.contentUri }
      mediaStorePermissionsDelegate.requestMediaLibraryActionPermission(assetIdsToDelete, needsDeletePermission = true)
      assets.forEach { asset -> asset.delete() }
    }

    AsyncFunction("requestPermissionsAsync") { writeOnly: Boolean, permissions: List<GranularPermission>?, promise: Promise ->
      systemPermissionsDelegate.requestPermissions(writeOnly, permissions, promise)
    }

    AsyncFunction("getPermissionsAsync") { writeOnly: Boolean, permissions: List<GranularPermission>?, promise: Promise ->
      systemPermissionsDelegate.getPermissions(writeOnly, permissions, promise)
    }

    RegisterActivityContracts {
      with(mediaStorePermissionsDelegate) {
        registerMediaStoreContracts(this@MediaLibraryNextModule)
      }
    }
  }
}
