package expo.modules.medialibrary.next

import android.net.Uri
import expo.modules.kotlin.Promise
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.toKClass
import expo.modules.medialibrary.next.permissions.contracts.DeleteContract
import expo.modules.medialibrary.next.permissions.contracts.WriteContract
import expo.modules.medialibrary.next.objects.Album
import expo.modules.medialibrary.next.objects.Asset
import expo.modules.medialibrary.next.objects.factories.AlbumFactory
import expo.modules.medialibrary.next.objects.factories.AssetFactory
import expo.modules.medialibrary.next.permissions.MediaStorePermissionsDelegate
import expo.modules.medialibrary.next.permissions.SystemPermissionsDelegate
import expo.modules.medialibrary.next.permissions.enums.GranularPermission

class MediaLibraryNextModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val systemPermissionsDelegate by lazy {
    SystemPermissionsDelegate(appContext)
  }
  private val mediaStorePermissionsDelegate by lazy {
    MediaStorePermissionsDelegate(appContext)
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
      Constructor { id: Long ->
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
        self.assets
      }

      AsyncFunction("add") Coroutine { self: Album, asset: Asset ->
        systemPermissionsDelegate.requireSystemPermissions(true)
        mediaStorePermissionsDelegate.requestMediaLibraryActionPermission(listOf(asset.contentUri))
        self.add(asset)
      }

      AsyncFunction("delete") Coroutine { self: Album ->
        systemPermissionsDelegate.requireSystemPermissions(true)
        val assetIdsToDelete = self.assets.map { it.contentUri }
        mediaStorePermissionsDelegate.requestMediaLibraryActionPermission(assetIdsToDelete, needsDeletePermission = true)
        self.delete()
      }
    }

    AsyncFunction("createAsset") Coroutine { filePath: String, album: Album? ->
      systemPermissionsDelegate.requireSystemPermissions(false)
      val assetFactory = AssetFactory(context)
      return@Coroutine assetFactory.create(filePath, album?.getRelativePath())
    }

    @OptIn(EitherType::class)
    AsyncFunction("createAlbum") Coroutine { name: String, assetsRefs: Either<List<Asset>, List<String>>, move: Boolean ->
      systemPermissionsDelegate.requireSystemPermissions(false)
      val albumFactory = AlbumFactory(context)
      if (assetsRefs.`is`(toKClass<List<Asset>>())) {
        assetsRefs.get(toKClass<List<Asset>>()).let {
          return@Coroutine albumFactory.createFromAssets(name, it, move)
        }
      }
      if (assetsRefs.`is`(toKClass<List<String>>())) {
        assetsRefs.get(toKClass<List<String>>()).let {
          return@Coroutine albumFactory.createFromFilePaths(name, it, AssetFactory(context))
        }
      }
    }

    AsyncFunction("deleteManyAlbums") Coroutine { albums: List<Album> ->
      systemPermissionsDelegate.requireSystemPermissions(true)
      albums.forEach { album -> album.delete() }
    }

    AsyncFunction("deleteManyAssets") Coroutine { assets: List<Asset> ->
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
      mediaStorePermissionsDelegate.deleteLauncher =
        registerForActivityResult(DeleteContract(this@MediaLibraryNextModule))
      mediaStorePermissionsDelegate.writeLauncher =
        registerForActivityResult(WriteContract(this@MediaLibraryNextModule))
    }
  }
}
