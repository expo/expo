package expo.modules.medialibrary

import android.Manifest.permission.*
import android.annotation.SuppressLint
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
import expo.modules.medialibrary.MediaLibraryModule.Action
import expo.modules.medialibrary.albums.AddAssetsToAlbum
import expo.modules.medialibrary.albums.CreateAlbum
import expo.modules.medialibrary.albums.DeleteAlbums
import expo.modules.medialibrary.albums.GetAlbum
import expo.modules.medialibrary.albums.GetAlbums
import expo.modules.medialibrary.albums.RemoveAssetsFromAlbum
import expo.modules.medialibrary.albums.getAssetsInAlbums
import expo.modules.medialibrary.albums.migration.CheckIfAlbumShouldBeMigrated
import expo.modules.medialibrary.albums.migration.MigrateAlbum
import expo.modules.medialibrary.assets.CreateAsset
import expo.modules.medialibrary.assets.DeleteAssets
import expo.modules.medialibrary.assets.GetAssetInfo
import expo.modules.medialibrary.assets.GetAssets

class MediaLibraryModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate(),
) : ExportedModule(context), ActivityEventListener {
  private val uiManager: UIManager by moduleRegistry()
  private val permissions: Permissions? by moduleRegistry()
  private val activityProvider: ActivityProvider by moduleRegistry()
  private val eventEmitter: EventEmitter by moduleRegistry()

  private var imagesObserver: MediaStoreContentObserver? = null
  private var videosObserver: MediaStoreContentObserver? = null
  private var awaitingAction: Action? = null

  override fun getName() = "ExponentMediaLibrary"

  override fun getConstants(): Map<String, Any> {
    return mapOf(
      "MediaType" to MediaType.getConstants(),
      "SortBy" to SortBy.getConstants(),
      "CHANGE_LISTENER_NAME" to LIBRARY_DID_CHANGE_EVENT,
    )
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  @ExpoMethod
  fun requestPermissionsAsync(writeOnly: Boolean, promise: Promise) {
    Permissions.askForPermissionsWithPermissionsManager(
      permissions,
      promise,
      *getManifestPermissions(writeOnly)
    )
  }

  @ExpoMethod
  fun getPermissionsAsync(writeOnly: Boolean, promise: Promise) {
    Permissions.getPermissionsWithPermissionsManager(
      permissions,
      promise,
      *getManifestPermissions(writeOnly)
    )
  }

  @ExpoMethod
  fun saveToLibraryAsync(
    localUri: String,
    promise: Promise
  ) = rejectUnlessPermissionsGranted(promise, writeOnly = true) {
    CreateAsset(context, localUri, promise, false)
      .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
  }

  @ExpoMethod
  fun createAssetAsync(
    localUri: String,
    promise: Promise
  ) = rejectUnlessPermissionsGranted(promise) {
    CreateAsset(context, localUri, promise)
      .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
  }

  @ExpoMethod
  fun addAssetsToAlbumAsync(
    assetsId: List<String>,
    albumId: String,
    copyToAlbum: Boolean,
    promise: Promise
  ) = rejectUnlessPermissionsGranted(promise, writeOnly = false) {
    val action = actionIfUserGrantedPermission(promise) {
      AddAssetsToAlbum(context, assetsId.toTypedArray(), albumId, copyToAlbum, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
    }
    runActionWithPermissions(if (copyToAlbum) emptyList() else assetsId, action, promise)
  }

  @ExpoMethod
  fun removeAssetsFromAlbumAsync(
    assetsId: List<String>,
    albumId: String,
    promise: Promise
  ) = rejectUnlessPermissionsGranted(promise) {
    val action = actionIfUserGrantedPermission(promise) {
      RemoveAssetsFromAlbum(context, assetsId.toTypedArray(), albumId, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
    }
    runActionWithPermissions(assetsId, action, promise)
  }

  @ExpoMethod
  fun deleteAssetsAsync(
    assetsId: List<String>,
    promise: Promise
  ) = rejectUnlessPermissionsGranted(promise) {
    val action = actionIfUserGrantedPermission(promise) {
      DeleteAssets(context, assetsId.toTypedArray(), promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
    }
    runActionWithPermissions(assetsId, action, promise)
  }

  @ExpoMethod
  fun getAssetInfoAsync(
    assetId: String,
    options: Map<String, Any?>? /* unused on android atm */,
    promise: Promise
  ) = rejectUnlessPermissionsGranted(promise, writeOnly = false) {
    GetAssetInfo(context, assetId, promise).executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
  }

  @ExpoMethod
  fun getAlbumsAsync(
    options: Map<String, Any?>? /* unused on android atm */,
    promise: Promise
  ) = rejectUnlessPermissionsGranted(promise) {
    GetAlbums(context, promise).executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
  }

  @ExpoMethod
  fun getAlbumAsync(
    albumName: String,
    promise: Promise
  ) = rejectUnlessPermissionsGranted(promise) {
    GetAlbum(context, albumName, promise)
      .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
  }

  @ExpoMethod
  fun createAlbumAsync(
    albumName: String,
    assetId: String,
    copyAsset: Boolean,
    promise: Promise
  ) = rejectUnlessPermissionsGranted(promise) {
    val action = actionIfUserGrantedPermission(promise) {
      CreateAlbum(context, albumName, assetId, copyAsset, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
    }
    runActionWithPermissions(if (copyAsset) emptyList() else listOf(assetId), action, promise)
  }

  @ExpoMethod
  fun deleteAlbumsAsync(
    albumIds: List<String>,
    promise: Promise
  ) = rejectUnlessPermissionsGranted(promise) {
    val action = actionIfUserGrantedPermission(promise) {
      DeleteAlbums(context, albumIds, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
    }
    val assetIds = getAssetsInAlbums(context, *albumIds.toTypedArray())
    runActionWithPermissions(assetIds, action, promise)
  }

  @ExpoMethod
  fun getAssetsAsync(
    assetOptions: Map<String, Any?>,
    promise: Promise
  ) = rejectUnlessPermissionsGranted(promise) {
    GetAssets(context, assetOptions, promise)
      .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
  }

  @ExpoMethod
  fun migrateAlbumIfNeededAsync(albumId: String, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      promise.resolve(null)
      return
    }

    val assets = MediaLibraryUtils.getAssetsById(
      context,
      null,
      *getAssetsInAlbums(context, albumId).toTypedArray()
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

    val action = actionIfUserGrantedPermission(promise) {
      MigrateAlbum(context, assets, albumDir.name, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
    }
    val needsToCheckPermissions = assets.map { it.assetId }
    runActionWithPermissions(needsToCheckPermissions, action, promise)
  }

  @ExpoMethod
  fun albumNeedsMigrationAsync(
    albumId: String,
    promise: Promise
  ) = rejectUnlessPermissionsGranted(promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      CheckIfAlbumShouldBeMigrated(context, albumId, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
      return
    }
    promise.resolve(false)
  }

  // Library change observer
  @ExpoMethod
  fun startObserving(promise: Promise) {
    if (imagesObserver != null) {
      promise.resolve(null)
      return
    }

    // We need to register an observer for each type of assets,
    // because it seems that observing a parent directory (EXTERNAL_CONTENT) doesn't work well,
    // whereas observing directory of images or videos works fine.
    val handler = Handler()
    val contentResolver = context.contentResolver

    imagesObserver =
      MediaStoreContentObserver(handler, MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE)
        .also { imageObserver ->
          contentResolver.registerContentObserver(
            MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
            true,
            imageObserver
          )
        }

    videosObserver =
      MediaStoreContentObserver(handler, MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO)
        .also { videoObserver ->
          contentResolver.registerContentObserver(
            MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
            true,
            videoObserver
          )
        }

    promise.resolve(null)
  }

  @ExpoMethod
  fun stopObserving(promise: Promise) {
    val contentResolver = context.contentResolver
    imagesObserver?.let {
      contentResolver.unregisterContentObserver(it)
      imagesObserver = null
    }
    videosObserver?.let {
      contentResolver.unregisterContentObserver(it)
      videosObserver = null
    }
    promise.resolve(null)
  }

  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?
  ) {
    awaitingAction?.takeIf { requestCode == WRITE_REQUEST_CODE }?.let {
      it.runWithPermissions(resultCode == Activity.RESULT_OK)
      awaitingAction = null
      uiManager.unregisterActivityEventListener(this)
    }
  }

  override fun onNewIntent(intent: Intent) {}

  private val isMissingPermissions: Boolean
    get() = permissions
      ?.hasGrantedPermissions(READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE)
      ?.not() ?: false

  private val isMissingWritePermission: Boolean
    get() = permissions
      ?.hasGrantedPermissions(WRITE_EXTERNAL_STORAGE)
      ?.not() ?: false

  @SuppressLint("InlinedApi")
  private fun getManifestPermissions(writeOnly: Boolean): Array<String> {
    // ACCESS_MEDIA_LOCATION should not be requested if it's absent in android-manifest
    val shouldAddMediaLocationAccess =
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q &&
        MediaLibraryUtils.hasManifestPermission(context, ACCESS_MEDIA_LOCATION)

    return listOfNotNull(
      WRITE_EXTERNAL_STORAGE,
      READ_EXTERNAL_STORAGE.takeIf { !writeOnly },
      ACCESS_MEDIA_LOCATION.takeIf { shouldAddMediaLocationAccess }
    ).toTypedArray()
  }

  private inline fun rejectUnlessPermissionsGranted(promise: Promise, writeOnly: Boolean = false, block: () -> Unit) {
    val missingPermissionsCondition = if (writeOnly) isMissingWritePermission else isMissingPermissions
    val missingPermissionsMessage = if (writeOnly) ERROR_NO_WRITE_PERMISSION_MESSAGE else ERROR_NO_PERMISSIONS_MESSAGE
    if (missingPermissionsCondition) {
      promise.reject(ERROR_NO_PERMISSIONS, missingPermissionsMessage)
      return
    }
    block()
  }

  private fun interface Action {
    fun runWithPermissions(permissionsWereGranted: Boolean)
  }

  private fun runActionWithPermissions(assetsId: List<String>, action: Action, promise: Promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val pathsWithoutPermissions = MediaLibraryUtils.getAssetsUris(context, assetsId)
        .filter { uri ->
          context.checkUriPermission(
            uri,
            Binder.getCallingPid(),
            Binder.getCallingUid(), Intent.FLAG_GRANT_WRITE_URI_PERMISSION
          ) != PackageManager.PERMISSION_GRANTED
        }

      if (pathsWithoutPermissions.isNotEmpty()) {
        val deleteRequest =
          MediaStore.createWriteRequest(context.contentResolver, pathsWithoutPermissions)
        val activity = activityProvider.currentActivity

        try {
          uiManager.registerActivityEventListener(this)
          awaitingAction = action
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
          awaitingAction = null
        }
        return
      }
    }
    action.runWithPermissions(true)
  }

  private fun actionIfUserGrantedPermission(
    promise: Promise,
    block: () -> Unit
  ) = Action { permissionsWereGranted ->
    if (!permissionsWereGranted) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_USER_DID_NOT_GRANT_WRITE_PERMISSIONS_MESSAGE)
      return@Action
    }
    block()
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
        eventEmitter.emit(LIBRARY_DID_CHANGE_EVENT, Bundle())
      }
    }

    private fun getAssetsTotalCount(mediaType: Int): Int =
      context.contentResolver.query(
        EXTERNAL_CONTENT_URI,
        null,
        "${MediaStore.Files.FileColumns.MEDIA_TYPE} == $mediaType",
        null,
        null
      ).use { countCursor -> countCursor?.count ?: 0 }
  }

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  companion object {
    private const val WRITE_REQUEST_CODE = 7463
  }
}
