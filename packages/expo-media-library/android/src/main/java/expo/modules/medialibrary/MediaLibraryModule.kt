package expo.modules.medialibrary

import android.Manifest.permission
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.IntentSender.SendIntentException
import android.content.pm.PackageManager
import android.database.ContentObserver
import android.net.Uri
import android.os.AsyncTask
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.provider.MediaStore
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.Promise
import expo.modules.core.interfaces.ActivityEventListener
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.core.interfaces.services.UIManager
import expo.modules.interfaces.permissions.Permissions
import expo.modules.medialibrary.MediaLibraryConstants.*
import expo.modules.medialibrary.MediaLibraryModule.Action

class MediaLibraryModule(
  private val mContext: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate(),
) : ExportedModule(mContext), ActivityEventListener {
  private val mUIManager: UIManager by moduleRegistry()
  private val mPermissions: Permissions? by moduleRegistry()
  private val mActivityProvider: ActivityProvider by moduleRegistry()
  private val mEventEmitter: EventEmitter by moduleRegistry()

  private var mImagesObserver: MediaStoreContentObserver? = null
  private var mVideosObserver: MediaStoreContentObserver? = null
  private var mAction: Action? = null

  override fun getName() = "ExponentMediaLibrary"

  override fun getConstants(): Map<String, Any> {
    return mapOf(
      "MediaType" to mapOf<String, Any>(
        "audio" to MEDIA_TYPE_AUDIO,
        "photo" to MEDIA_TYPE_PHOTO,
        "video" to MEDIA_TYPE_VIDEO,
        "unknown" to MEDIA_TYPE_UNKNOWN,
        "all" to MEDIA_TYPE_ALL,
      ),
      "SortBy" to mapOf<String, Any>(
        "default" to SORT_BY_DEFAULT,
        "creationTime" to SORT_BY_CREATION_TIME,
        "modificationTime" to SORT_BY_MODIFICATION_TIME,
        "mediaType" to SORT_BY_MEDIA_TYPE,
        "width" to SORT_BY_WIDTH,
        "height" to SORT_BY_HEIGHT,
        "duration" to SORT_BY_DURATION,
      ),
      "CHANGE_LISTENER_NAME" to LIBRARY_DID_CHANGE_EVENT,
    )
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  @ExpoMethod
  fun requestPermissionsAsync(writeOnly: Boolean, promise: Promise) {
    Permissions.askForPermissionsWithPermissionsManager(
      mPermissions,
      promise,
      *getManifestPermissions(writeOnly)
    )
  }

  @ExpoMethod
  fun getPermissionsAsync(writeOnly: Boolean, promise: Promise) {
    Permissions.getPermissionsWithPermissionsManager(
      mPermissions,
      promise,
      *getManifestPermissions(writeOnly)
    )
  }

  @ExpoMethod
  fun saveToLibraryAsync(localUri: String, promise: Promise) {
    if (isMissingWritePermission) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_WRITE_PERMISSION_MESSAGE)
      return
    }
    CreateAsset(mContext, localUri, promise, false)
      .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
  }

  @ExpoMethod
  fun createAssetAsync(localUri: String, promise: Promise) {
    if (isMissingPermissions) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE)
      return
    }
    CreateAsset(mContext, localUri, promise)
      .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
  }

  @ExpoMethod
  fun addAssetsToAlbumAsync(
    assetsId: List<String>,
    albumId: String,
    copyToAlbum: Boolean,
    promise: Promise
  ) {
    if (isMissingPermissions) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE)
      return
    }
    val action = Action action@{ permissionsWereGranted ->
      if (!permissionsWereGranted) {
        promise.reject(ERROR_NO_PERMISSIONS, ERROR_USER_DID_NOT_GRANT_WRITE_PERMISSIONS_MESSAGE)
        return@action
      }
      AddAssetsToAlbum(mContext, assetsId.toTypedArray(), albumId, copyToAlbum, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
    }
    runActionWithPermissions(if (copyToAlbum) emptyList() else assetsId, action, promise)
  }

  @ExpoMethod
  fun removeAssetsFromAlbumAsync(assetsId: List<String>, albumId: String, promise: Promise) {
    if (isMissingPermissions) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE)
      return
    }
    val action = Action action@{ permissionsWereGranted ->
      if (!permissionsWereGranted) {
        promise.reject(ERROR_NO_PERMISSIONS, ERROR_USER_DID_NOT_GRANT_WRITE_PERMISSIONS_MESSAGE)
        return@action
      }
      RemoveAssetsFromAlbum(mContext, assetsId.toTypedArray(), albumId, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
    }
    runActionWithPermissions(assetsId, action, promise)
  }

  @ExpoMethod
  fun deleteAssetsAsync(assetsId: List<String>, promise: Promise) {
    if (isMissingPermissions) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE)
      return
    }
    val action = Action action@{ permissionsWereGranted ->
      if (!permissionsWereGranted) {
        promise.reject(ERROR_NO_PERMISSIONS, ERROR_USER_DID_NOT_GRANT_WRITE_PERMISSIONS_MESSAGE)
        return@action
      }
      DeleteAssets(mContext, assetsId.toTypedArray(), promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
    }
    runActionWithPermissions(assetsId, action, promise)
  }

  @ExpoMethod
  fun getAssetInfoAsync(
    assetId: String,
    options: Map<String, Any?>? /* unused on android atm */,
    promise: Promise
  ) {
    if (isMissingPermissions) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE)
      return
    }
    GetAssetInfo(mContext, assetId, promise).executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
  }

  @ExpoMethod
  fun getAlbumsAsync(options: Map<String, Any?>? /* unused on android atm */, promise: Promise) {
    if (isMissingPermissions) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE)
      return
    }
    GetAlbums(mContext, promise).executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
  }

  @ExpoMethod
  fun getAlbumAsync(albumName: String, promise: Promise) {
    if (isMissingPermissions) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE)
      return
    }
    GetAlbum(mContext, albumName, promise)
      .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
  }

  @ExpoMethod
  fun createAlbumAsync(albumName: String, assetId: String, copyAsset: Boolean, promise: Promise) {
    if (isMissingPermissions) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE)
      return
    }
    val action = Action action@{ permissionsWereGranted ->
      if (!permissionsWereGranted) {
        promise.reject(ERROR_NO_PERMISSIONS, ERROR_USER_DID_NOT_GRANT_WRITE_PERMISSIONS_MESSAGE)
        return@action
      }
      CreateAlbum(mContext, albumName, assetId, copyAsset, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
    }
    runActionWithPermissions(if (copyAsset) emptyList() else listOf(assetId), action, promise)
  }

  @ExpoMethod
  fun deleteAlbumsAsync(albumIds: List<String>, promise: Promise) {
    if (isMissingPermissions) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE)
      return
    }
    val action = Action action@{ permissionsWereGranted ->
      if (!permissionsWereGranted) {
        promise.reject(ERROR_NO_PERMISSIONS, ERROR_USER_DID_NOT_GRANT_WRITE_PERMISSIONS_MESSAGE)
        return@action
      }
      DeleteAlbums(mContext, albumIds, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
    }
    val assetIds = MediaLibraryUtils.getAssetsInAlbums(mContext, *albumIds.toTypedArray())
    runActionWithPermissions(assetIds, action, promise)
  }

  @ExpoMethod
  fun getAssetsAsync(assetOptions: Map<String, Any?>, promise: Promise) {
    if (isMissingPermissions) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE)
      return
    }
    GetAssets(mContext, assetOptions, promise)
      .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
  }

  @ExpoMethod
  fun migrateAlbumIfNeededAsync(albumId: String, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      promise.resolve(null)
      return
    }

    val assets = MediaLibraryUtils.getAssetsById(
      mContext,
      null,
      *MediaLibraryUtils.getAssetsInAlbums(mContext, albumId).toTypedArray()
    )
    if (assets == null) {
      promise.reject(ERROR_NO_ALBUM, "Couldn't find album.")
      return
    }

    val albumsMap = assets
      // All files should have mime type, but if not, we can safely assume that
      // those without mime type shouldn't be move
      .filter { it.mimeType != null }
      .groupBy { it.parentFile }

    if (albumsMap.size != 1) {
      // Empty albums shouldn't be visible to users. That's why this is an error.
      promise.reject(ERROR_NO_ALBUM, "Found album is empty.")
      return
    }
    val albumDir = assets[0].parentFile
    if (albumDir == null) {
      promise.reject(ERROR_NO_ALBUM, "Couldn't get album path.")
      return
    }
    if (albumDir.canWrite()) {
      // Nothing to migrate
      promise.resolve(null)
      return
    }

    val action = Action action@{ permissionsWereGranted: Boolean ->
      if (!permissionsWereGranted) {
        promise.reject(ERROR_NO_PERMISSIONS, ERROR_USER_DID_NOT_GRANT_WRITE_PERMISSIONS_MESSAGE)
        return@action
      }
      MigrateAlbum(mContext, assets, albumDir.name, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
    }
    val needsToCheckPermissions = assets.map { it.assetId }
    runActionWithPermissions(needsToCheckPermissions, action, promise)
  }

  @ExpoMethod
  fun albumNeedsMigrationAsync(albumId: String, promise: Promise) {
    if (isMissingPermissions) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE)
      return
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      CheckIfAlbumShouldBeMigrated(mContext, albumId, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
      return
    }
    promise.resolve(false)
  }

  // Library change observer
  @ExpoMethod
  fun startObserving(promise: Promise) {
    if (mImagesObserver != null) {
      promise.resolve(null)
      return
    }

    // We need to register an observer for each type of assets,
    // because it seems that observing a parent directory (EXTERNAL_CONTENT) doesn't work well,
    // whereas observing directory of images or videos works fine.
    val handler = Handler()
    val contentResolver = mContext.contentResolver

    mImagesObserver =
      MediaStoreContentObserver(handler, MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE)
        .also { imagesObserver ->
          contentResolver.registerContentObserver(
            MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
            true,
            imagesObserver
          )
        }

    mVideosObserver =
      MediaStoreContentObserver(handler, MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO)
        .also { videosObserver ->
          contentResolver.registerContentObserver(
            MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
            true,
            videosObserver
          )
        }

    promise.resolve(null)
  }

  @ExpoMethod
  fun stopObserving(promise: Promise) {
    if (mImagesObserver != null) {
      val contentResolver = mContext.contentResolver
      contentResolver.unregisterContentObserver(mImagesObserver!!)
      contentResolver.unregisterContentObserver(mVideosObserver!!)
      mImagesObserver = null
      mVideosObserver = null
    }
    promise.resolve(null)
  }

  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?
  ) {
    if (requestCode == WRITE_REQUEST_CODE && mAction != null) {
      mAction!!.runWithPermissions(resultCode == Activity.RESULT_OK)
      mAction = null
      mUIManager.unregisterActivityEventListener(this)
    }
  }

  override fun onNewIntent(intent: Intent) {}

  private val isMissingPermissions: Boolean
    get() = mPermissions
      ?.hasGrantedPermissions(permission.READ_EXTERNAL_STORAGE, permission.WRITE_EXTERNAL_STORAGE)
      ?.not() ?: false

  private val isMissingWritePermission: Boolean
    get() = mPermissions
      ?.hasGrantedPermissions(permission.WRITE_EXTERNAL_STORAGE)
      ?.not() ?: false

  private fun getManifestPermissions(writeOnly: Boolean): Array<String> {
    return if (writeOnly) {
      arrayOf(permission.WRITE_EXTERNAL_STORAGE, permission.ACCESS_MEDIA_LOCATION)
    } else {
      arrayOf(
        permission.READ_EXTERNAL_STORAGE,
        permission.WRITE_EXTERNAL_STORAGE,
        permission.ACCESS_MEDIA_LOCATION
      )
    }
  }

  private fun runActionWithPermissions(assetsId: List<String>, action: Action, promise: Promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {

      val pathsWithoutPermissions = MediaLibraryUtils.getAssetsUris(mContext, assetsId)
        .filter { uri ->
          mContext.checkUriPermission(
            uri,
            Binder.getCallingPid(),
            Binder.getCallingUid(), Intent.FLAG_GRANT_WRITE_URI_PERMISSION
          ) != PackageManager.PERMISSION_GRANTED
        }

      if (pathsWithoutPermissions.isNotEmpty()) {
        val deleteRequest =
          MediaStore.createWriteRequest(mContext.contentResolver, pathsWithoutPermissions)
        val activity = mActivityProvider.currentActivity

        try {
          mUIManager.registerActivityEventListener(this)
          mAction = action
          activity.startIntentSenderForResult(
            deleteRequest.intentSender,
            WRITE_REQUEST_CODE,
            null,
            0,
            0,
            0
          )
        } catch (e: SendIntentException) {
          promise.reject(ERROR_UNABLE_TO_ASK_FOR_PERMISSIONS, ERROR_UNABLE_TO_ASK_FOR_PERMISSIONS_MESSAGE)
          mAction = null
        }
        return
      }
    }
    action.runWithPermissions(true)
  }

  private fun interface Action {
    fun runWithPermissions(permissionsWereGranted: Boolean)
  }

  private inner class MediaStoreContentObserver(handler: Handler, private val mMediaType: Int) :
    ContentObserver(handler) {

    private var mAssetsTotalCount = getAssetsTotalCount(mMediaType)

    override fun onChange(selfChange: Boolean) {
      this.onChange(selfChange, null)
    }

    override fun onChange(selfChange: Boolean, uri: Uri?) {
      val newTotalCount = getAssetsTotalCount(mMediaType)

      // Send event to JS only when assets count has been changed - to filter out some unnecessary events.
      // It's not perfect solution if someone adds and deletes the same number of assets in a short period of time, but I hope these events will not be batched.
      if (mAssetsTotalCount != newTotalCount) {
        mAssetsTotalCount = newTotalCount
        mEventEmitter.emit(LIBRARY_DID_CHANGE_EVENT, Bundle())
      }
    }

    private fun getAssetsTotalCount(mediaType: Int): Int {
      return mContext.contentResolver.query(
        EXTERNAL_CONTENT,
        null,
        "${MediaStore.Files.FileColumns.MEDIA_TYPE} == $mediaType",
        null,
        null
      ).use { countCursor -> countCursor?.count ?: 0 }
    }
  }

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  companion object {
    private const val WRITE_REQUEST_CODE = 7463
  }
}
