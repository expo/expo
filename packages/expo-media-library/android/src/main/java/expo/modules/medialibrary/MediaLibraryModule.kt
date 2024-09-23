package expo.modules.medialibrary

import android.Manifest.permission.ACCESS_MEDIA_LOCATION
import android.Manifest.permission.READ_EXTERNAL_STORAGE
import android.Manifest.permission.READ_MEDIA_AUDIO
import android.Manifest.permission.READ_MEDIA_IMAGES
import android.Manifest.permission.READ_MEDIA_VIDEO
import android.Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED
import android.Manifest.permission.WRITE_EXTERNAL_STORAGE
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.IntentSender.SendIntentException
import android.content.pm.PackageManager
import android.database.ContentObserver
import android.net.Uri
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.util.Log
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.interfaces.permissions.Permissions.askForPermissionsWithPermissionsManager
import expo.modules.interfaces.permissions.Permissions.getPermissionsWithPermissionsManager
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference

class MediaLibraryModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val moduleCoroutineScope = CoroutineScope(Dispatchers.IO)
  private var imagesObserver: MediaStoreContentObserver? = null
  private var videosObserver: MediaStoreContentObserver? = null
  private var awaitingAction: Action? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoMediaLibrary")

    Constants {
      return@Constants mapOf(
        "MediaType" to MediaType.getConstants(),
        "SortBy" to SortBy.getConstants(),
        "CHANGE_LISTENER_NAME" to LIBRARY_DID_CHANGE_EVENT
      )
    }

    Events(LIBRARY_DID_CHANGE_EVENT)

    AsyncFunction("requestPermissionsAsync") { writeOnly: Boolean, permissions: List<GranularPermission>?, promise: Promise ->
      val granularPermissions = permissions ?: listOf(GranularPermission.AUDIO, GranularPermission.PHOTO, GranularPermission.VIDEO)
      askForPermissionsWithPermissionsManager(
        appContext.permissions,
        MediaLibraryPermissionPromiseWrapper(granularPermissions, promise, WeakReference(context)),
        *getManifestPermissions(writeOnly, granularPermissions)
      )
    }

    AsyncFunction("getPermissionsAsync") { writeOnly: Boolean, permissions: List<GranularPermission>?, promise: Promise ->
      val granularPermissions = permissions ?: listOf(GranularPermission.AUDIO, GranularPermission.PHOTO, GranularPermission.VIDEO)
      getPermissionsWithPermissionsManager(
        appContext.permissions,
        MediaLibraryPermissionPromiseWrapper(granularPermissions, promise, WeakReference(context)),
        *getManifestPermissions(writeOnly, granularPermissions)
      )
    }

    AsyncFunction("saveToLibraryAsync") { localUri: String, promise: Promise ->
      throwUnlessPermissionsGranted {
        withModuleScope(promise) {
          CreateAsset(context, localUri, promise, false)
            .execute()
        }
      }
    }

    AsyncFunction("createAssetAsync") { localUri: String, promise: Promise ->
      throwUnlessPermissionsGranted {
        withModuleScope(promise) {
          CreateAsset(context, localUri, promise)
            .execute()
        }
      }
    }

    AsyncFunction("addAssetsToAlbumAsync") { assetsId: List<String>, albumId: String, copyToAlbum: Boolean, promise: Promise ->
      throwUnlessPermissionsGranted {
        val action = actionIfUserGrantedPermission(promise) {
          withModuleScope(promise) {
            AddAssetsToAlbum(context, assetsId.toTypedArray(), albumId, copyToAlbum, promise)
              .execute()
          }
        }
        runActionWithPermissions(if (copyToAlbum) emptyList() else assetsId, action)
      }
    }

    AsyncFunction("removeAssetsFromAlbumAsync") { assetsId: List<String>, albumId: String, promise: Promise ->
      throwUnlessPermissionsGranted {
        val action = actionIfUserGrantedPermission(promise) {
          withModuleScope(promise) {
            RemoveAssetsFromAlbum(context, assetsId.toTypedArray(), albumId, promise)
              .execute()
          }
        }
        runActionWithPermissions(assetsId, action)
      }
    }

    AsyncFunction("deleteAssetsAsync") { assetsId: List<String>, promise: Promise ->
      throwUnlessPermissionsGranted {
        val action = actionIfUserGrantedPermission(promise) {
          withModuleScope(promise) {
            DeleteAssets(context, assetsId.toTypedArray(), promise)
              .execute()
          }
        }
        runActionWithPermissions(assetsId, action)
      }
    }

    AsyncFunction("getAssetInfoAsync") { assetId: String, _: Map<String, Any?>?/* unused on android atm */, promise: Promise ->
      throwUnlessPermissionsGranted(isWrite = false) {
        withModuleScope(promise) {
          GetAssetInfo(context, assetId, promise).execute()
        }
      }
    }

    AsyncFunction("getAlbumsAsync") { _: Map<String, Any?>?/* unused on android atm */, promise: Promise ->
      throwUnlessPermissionsGranted(isWrite = false) {
        withModuleScope(promise) {
          GetAlbums(context, promise).execute()
        }
      }
    }

    AsyncFunction("getAlbumAsync") { albumName: String, promise: Promise ->
      throwUnlessPermissionsGranted(isWrite = false) {
        withModuleScope(promise) {
          GetAlbum(context, albumName, promise)
            .execute()
        }
      }
    }

    AsyncFunction("createAlbumAsync") { albumName: String, assetId: String, copyAsset: Boolean, promise: Promise ->
      throwUnlessPermissionsGranted {
        val action = actionIfUserGrantedPermission(promise) {
          withModuleScope(promise) {
            CreateAlbum(context, albumName, assetId, copyAsset, promise)
              .execute()
          }
        }
        runActionWithPermissions(if (copyAsset) emptyList() else listOf(assetId), action)
      }
    }

    AsyncFunction("deleteAlbumsAsync") { albumIds: List<String>, promise: Promise ->
      throwUnlessPermissionsGranted {
        val action = actionIfUserGrantedPermission(promise) {
          withModuleScope(promise) {
            DeleteAlbums(context, albumIds, promise)
              .execute()
          }
        }
        val assetIds = getAssetsInAlbums(context, *albumIds.toTypedArray())
        runActionWithPermissions(assetIds, action)
      }
    }

    AsyncFunction("getAssetsAsync") { assetOptions: AssetsOptions, promise: Promise ->
      throwUnlessPermissionsGranted(isWrite = false) {
        withModuleScope(promise) {
          GetAssets(context, assetOptions, promise)
            .execute()
        }
      }
    }

    AsyncFunction("migrateAlbumIfNeededAsync") { albumId: String, promise: Promise ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
        return@AsyncFunction
      }

      val assetsIds = getAssetsInAlbums(context, albumId)
        .filter { it.isNotEmpty() }
        .toTypedArray()
      // The album is empty, nothing to migrate
      if (assetsIds.isEmpty()) {
        return@AsyncFunction
      }

      val assets = MediaLibraryUtils.getAssetsById(
        context,
        null,
        *assetsIds
      )

      val albumsMap = assets
        // All files should have mime type, but if not, we can safely assume that
        // those without mime type shouldn't be move
        .groupBy { it.parentFile }

      if (albumsMap.size != 1) {
        // Empty albums shouldn't be visible to users. That's why this is an error.
        throw EmptyAlbumException()
      }

      val albumDir = assets[0].parentFile ?: throw AlbumPathException()
      if (albumDir.canWrite()) {
        return@AsyncFunction
      }

      val action = actionIfUserGrantedPermission(promise) {
        moduleCoroutineScope.launch {
          MigrateAlbum(context, assets, albumDir.name, promise)
            .execute()
        }
      }

      val needsToCheckPermissions = assets.map { it.assetId }
      runActionWithPermissions(needsToCheckPermissions, action)
    }

    AsyncFunction("albumNeedsMigrationAsync") { albumId: String, promise: Promise ->
      throwUnlessPermissionsGranted(isWrite = false) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          moduleCoroutineScope.launch {
            try {
              CheckIfAlbumShouldBeMigrated(context, albumId, promise)
                .execute()
            } catch (e: CodedException) {
              promise.reject(e)
            }
          }
        }
        promise.resolve(false)
      }
    }

    OnStartObserving {
      if (imagesObserver != null) {
        return@OnStartObserving
      }

      // We need to register an observer for each type of assets,
      // because it seems that observing a parent directory (EXTERNAL_CONTENT) doesn't work well,
      // whereas observing directory of images or videos works fine.
      val handler = Handler(Looper.getMainLooper())
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

      videosObserver = MediaStoreContentObserver(handler, MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO)
        .also { videoObserver ->
          contentResolver.registerContentObserver(
            MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
            true,
            videoObserver
          )
        }
    }

    OnStopObserving {
      val contentResolver = context.contentResolver
      imagesObserver?.let {
        contentResolver.unregisterContentObserver(it)
        imagesObserver = null
      }
      videosObserver?.let {
        contentResolver.unregisterContentObserver(it)
        videosObserver = null
      }
    }

    OnActivityResult { _, payload ->
      awaitingAction?.takeIf { payload.requestCode == WRITE_REQUEST_CODE }?.let {
        it.runWithPermissions(payload.resultCode == Activity.RESULT_OK)
        awaitingAction = null
      }
    }

    OnDestroy {
      try {
        moduleCoroutineScope.cancel(ModuleDestroyedException())
      } catch (e: IllegalStateException) {
        Log.e(TAG, "The scope does not have a job in it")
      }
    }
  }

  private inline fun withModuleScope(promise: Promise, crossinline block: () -> Unit) = moduleCoroutineScope.launch {
    try {
      block()
    } catch (e: CodedException) {
      promise.reject(e)
    } catch (e: ModuleDestroyedException) {
      promise.reject(TAG, "MediaLibrary module destroyed", e)
    }
  }

  private val isMissingPermissions: Boolean
    get() = hasReadPermissions()

  private val isMissingWritePermission: Boolean
    get() = hasWritePermissions()

  @SuppressLint("InlinedApi")
  private fun getManifestPermissions(writeOnly: Boolean, granularPermissions: List<GranularPermission>): Array<String> {
    // ACCESS_MEDIA_LOCATION should not be requested if it's absent in android-manifest
    // If only audio permission is requested, we don't need to request media location permissions
    val shouldAddMediaLocationAccess =
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q &&
        MediaLibraryUtils.hasManifestPermission(context, ACCESS_MEDIA_LOCATION) &&
        !(
          Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            granularPermissions.count() == 1 && granularPermissions.contains(GranularPermission.AUDIO)
          )

    val shouldAddWriteExternalStorage =
      Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU &&
        MediaLibraryUtils.hasManifestPermission(context, WRITE_EXTERNAL_STORAGE)

    val shouldAddGranularPermissions =
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
        granularPermissions.all { MediaLibraryUtils.hasManifestPermission(context, it.toManifestPermission()) }

    val shouldIncludeGranular = shouldAddGranularPermissions && !writeOnly
    return listOfNotNull(
      WRITE_EXTERNAL_STORAGE.takeIf { shouldAddWriteExternalStorage },
      READ_EXTERNAL_STORAGE.takeIf { !writeOnly && !shouldAddGranularPermissions },
      ACCESS_MEDIA_LOCATION.takeIf { shouldAddMediaLocationAccess },
      *getGranularPermissions(shouldIncludeGranular, granularPermissions)
    ).toTypedArray()
  }

  @SuppressLint("InlinedApi")
  private fun getGranularPermissions(shouldIncludeGranular: Boolean, granularPermissions: List<GranularPermission>): Array<String> {
    return if (shouldIncludeGranular) {
      listOfNotNull(
        READ_MEDIA_IMAGES.takeIf { granularPermissions.contains(GranularPermission.PHOTO) },
        READ_MEDIA_VIDEO.takeIf { granularPermissions.contains(GranularPermission.VIDEO) },
        READ_MEDIA_AUDIO.takeIf { granularPermissions.contains(GranularPermission.AUDIO) }
      ).toTypedArray()
    } else {
      arrayOf()
    }
  }

  private inline fun throwUnlessPermissionsGranted(isWrite: Boolean = true, block: () -> Unit) {
    val missingPermissionsCondition = if (isWrite) isMissingWritePermission else isMissingPermissions
    if (missingPermissionsCondition) {
      val missingPermissionsMessage = if (isWrite) ERROR_NO_WRITE_PERMISSION_MESSAGE else ERROR_NO_PERMISSIONS_MESSAGE
      throw PermissionsException(missingPermissionsMessage)
    }
    block()
  }

  private fun interface Action {
    fun runWithPermissions(permissionsWereGranted: Boolean)
  }

  private fun hasReadPermissions(): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      val permissions = mutableListOf(READ_MEDIA_IMAGES, READ_MEDIA_AUDIO, READ_MEDIA_VIDEO)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        permissions.add(READ_MEDIA_VISUAL_USER_SELECTED)
      }

      // Android will only return albums that the user allowed access to.
      permissions.map { permission ->
        appContext.permissions
          ?.hasGrantedPermissions(permission) ?: false
      }.any { it }.not()
    } else {
      val permissions = arrayOf(READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE)
      appContext.permissions
        ?.hasGrantedPermissions(*permissions)
        ?.not() ?: false
    }
  }

  private fun hasWritePermissions() = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    false
  } else {
    appContext.permissions
      ?.hasGrantedPermissions(WRITE_EXTERNAL_STORAGE)
      ?.not() ?: false
  }

  private fun runActionWithPermissions(assetsId: List<String>, action: Action) {
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

        try {
          awaitingAction = action
          appContext.throwingActivity.startIntentSenderForResult(
            deleteRequest.intentSender,
            WRITE_REQUEST_CODE,
            null,
            0,
            0,
            0
          )
        } catch (e: SendIntentException) {
          awaitingAction = null
          throw e
        }
        // the action will be called when permissions are granted
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
      promise.reject(PermissionsException(ERROR_USER_DID_NOT_GRANT_WRITE_PERMISSIONS_MESSAGE))
    } else {
      block()
    }
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
        sendEvent(LIBRARY_DID_CHANGE_EVENT, Bundle())
      }
    }

    private fun getAssetsTotalCount(mediaType: Int): Int =
      context.contentResolver.query(
        EXTERNAL_CONTENT_URI,
        arrayOf(),
        "${MediaStore.Files.FileColumns.MEDIA_TYPE} == $mediaType",
        null,
        null
      ).use { countCursor -> countCursor?.count ?: 0 }
  }

  companion object {
    private const val WRITE_REQUEST_CODE = 7463
    internal val TAG = MediaLibraryModule::class.java.simpleName
  }
}
