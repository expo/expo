package expo.modules.medialibrary.next

import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.toKClass
import expo.modules.medialibrary.next.objects.Album
import expo.modules.medialibrary.next.objects.Asset
import expo.modules.medialibrary.next.objects.factories.AlbumFactory
import expo.modules.medialibrary.next.objects.factories.AssetFactory

class MediaLibraryNextModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoMediaLibraryNext")

    Class(Asset::class) {
      Constructor { id: Long ->
        val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
        Asset(id, context)
      }

      Property("id") { self: Asset ->
        self.id
      }

      AsyncFunction("getLocalUri") { self: Asset ->
        self.getLocalUri()
      }

      AsyncFunction("getDisplayName") { self: Asset ->
        self.getDisplayName()
      }

      AsyncFunction("getMimeType") { self: Asset ->
        self.getMimeType()
      }

      AsyncFunction("delete") Coroutine { self: Asset ->
        self.delete()
      }
    }

    Class(Album::class) {
      Constructor { id: Long ->
        val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
        Album(id, context)
      }

      Property("id") { self: Album ->
        self.id
      }

      AsyncFunction("getName") { self: Album ->
        self.name
      }

      AsyncFunction("getAssets") { self: Album ->
        self.assets
      }

      AsyncFunction("add") Coroutine { self: Album, asset: Asset ->
        self.add(asset)
      }

      AsyncFunction("delete") Coroutine { self: Album ->
        self.delete()
      }
    }

    AsyncFunction("createAsset") Coroutine { filePath: String, album: Album? ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val assetFactory = AssetFactory(context)
      return@Coroutine assetFactory.create(filePath, album?.relativePath)
    }

    @OptIn(EitherType::class)
    AsyncFunction("createAlbum") Coroutine { name: String, assetsRefs: Either<List<Asset>, List<String>>, move: Boolean ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val albumFactory = AlbumFactory(context)
      return@Coroutine if (assetsRefs.`is`(toKClass<List<Asset>>())) {
        assetsRefs.get(toKClass<List<Asset>>()).let {
          return@let albumFactory.createFromAssets(name, it, move)
        }
      } else if (assetsRefs.`is`(toKClass<List<String>>())) {
        assetsRefs.get(toKClass<List<String>>()).let {
          return@let albumFactory.createFromFilePaths(name, it, AssetFactory(context))
        }
      } else {
        null
      }
    }

    AsyncFunction("deleteManyAlbums") Coroutine { albums: List<Album> ->
      albums.forEach { album -> album.delete() }
    }

    AsyncFunction("deleteManyAssets") Coroutine { assets: List<Asset> ->
      assets.forEach { asset -> asset.delete() }
    }
  }
}
