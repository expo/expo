package expo.modules.medialibrary

import android.Manifest.permission.ACCESS_MEDIA_LOCATION
import android.Manifest.permission.READ_EXTERNAL_STORAGE
import android.Manifest.permission.READ_MEDIA_AUDIO
import android.Manifest.permission.READ_MEDIA_IMAGES
import android.Manifest.permission.READ_MEDIA_VIDEO
import android.Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED
import android.Manifest.permission.WRITE_EXTERNAL_STORAGE
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.database.ContentObserver
import android.net.Uri
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import androidx.annotation.RequiresApi
import expo.modules.interfaces.permissions.Permissions.askForPermissionsWithPermissionsManager
import expo.modules.interfaces.permissions.Permissions.getPermissionsWithPermissionsManager
import expo.modules.kotlin.Promise
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.medialibrary.albums.AddAssetsToAlbum
import expo.modules.medialibrary.albums.CreateAlbum
import expo.modules.medialibrary.albums.CreateAlbumWithInitialFileUri
import expo.modules.medialibrary.albums.DeleteAlbums
import expo.modules.medialibrary.albums.GetAlbum
import expo.modules.medialibrary.albums.GetAlbums
import expo.modules.medialibrary.albums.RemoveAssetsFromAlbum
import expo.modules.medialibrary.albums.getAssetsInAlbums
import expo.modules.medialibrary.albums.migration.CheckIfAlbumShouldBeMigrated
import expo.modules.medialibrary.albums.migration.MigrateAlbum
import expo.modules.medialibrary.assets.CreateAssetWithAlbumId
import expo.modules.medialibrary.assets.DeleteAssets
import expo.modules.medialibrary.assets.GetAssetInfo
import expo.modules.medialibrary.assets.GetAssets
import expo.modules.medialibrary.contracts.DeleteContract
import expo.modules.medialibrary.contracts.DeleteContractInput
import expo.modules.medialibrary.contracts.WriteContract
import expo.modules.medialibrary.contracts.WriteContractInput
import java.lang.ref.WeakReference

class MediaLibraryModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private var imagesObserver: MediaStoreContentObserver? = null
  private var videosObserver: MediaStoreContentObserver? = null
  private lateinit var deleteLauncher: AppContextActivityResultLauncher<DeleteContractInput, Boolean>
  private lateinit var writeLauncher: AppContextActivityResultLauncher<WriteContractInput, Boolean>
  private val isExpoGo by lazy {
    context.resources.getString(R.string.is_expo_go).toBoolean()
  }
  private val allowedPermissionsList by lazy {
    if (isExpoGo) {
      listOf(GranularPermission.AUDIO)
    } else {
      getManifestDeclaredPermissions(context, listOf(GranularPermission.PHOTO, GranularPermission.VIDEO, GranularPermission.AUDIO))
    }
  }

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
      val granularPermissions = permissions ?: allowedPermissionsList
      maybeThrowIfExpoGo(granularPermissions)
      askForPermissionsWithPermissionsManager(
        appContext.permissions,
        MediaLibraryPermissionPromiseWrapper(granularPermissions, promise, WeakReference(context)),
        *getManifestPermissions(writeOnly, granularPermissions)
      )
    }

    AsyncFunction("getPermissionsAsync") { writeOnly: Boolean, permissions: List<GranularPermission>?, promise: Promise ->
      val granularPermissions = permissions ?: allowedPermissionsList
      maybeThrowIfExpoGo(granularPermissions)
      getPermissionsWithPermissionsManager(
        appContext.permissions,
        MediaLibraryPermissionPromiseWrapper(granularPermissions, promise, WeakReference(context)),
        *getManifestPermissions(writeOnly, granularPermissions)
      )
    }

    AsyncFunction("saveToLibraryAsync") Coroutine { localUri: String ->
      requireSystemPermissions()
      CreateAssetWithAlbumId(context, localUri, false).execute()
    }

    AsyncFunction("createAssetAsync") Coroutine { localUri: String, albumId: String? ->
      requireSystemPermissions()
      CreateAssetWithAlbumId(context, localUri, true, albumId).execute()
    }

    AsyncFunction("addAssetsToAlbumAsync") Coroutine { assetsId: List<String>, albumId: String, copyToAlbum: Boolean ->
      requireSystemPermissions()
      requestMediaLibraryActionPermission(if (copyToAlbum) emptyList() else assetsId)
      AddAssetsToAlbum(context, assetsId.toTypedArray(), albumId, copyToAlbum).execute()
    }

    AsyncFunction("removeAssetsFromAlbumAsync") Coroutine { assetsId: List<String>, albumId: String ->
      requireSystemPermissions()
      requestMediaLibraryActionPermission(assetsId)
      RemoveAssetsFromAlbum(context, assetsId.toTypedArray(), albumId).execute()
    }

    AsyncFunction("deleteAssetsAsync") Coroutine { assetsId: List<String> ->
      requireSystemPermissions()
      requestMediaLibraryActionPermission(assetsId, needsDeletePermission = true)
      DeleteAssets(context, assetsId.toTypedArray()).execute()
    }

    AsyncFunction("getAssetInfoAsync") Coroutine { assetId: String, _: Map<String, Any?>?/* unused on android atm */ ->
      requireSystemPermissions(false)
      GetAssetInfo(context, assetId).execute()
    }

    AsyncFunction("getAlbumsAsync") Coroutine { _: Map<String, Any?>?/* unused on android atm */ ->
      requireSystemPermissions(false)
      GetAlbums(context).execute()
    }

    AsyncFunction("getAlbumAsync") Coroutine { albumName: String ->
      requireSystemPermissions(false)
      GetAlbum(context, albumName).execute()
    }

    AsyncFunction("createAlbumAsync") Coroutine { albumName: String, assetId: String?, copyAsset: Boolean, initialAssetUri: Uri? ->
      requireSystemPermissions()

      val assetIdList = if (!copyAsset && assetId != null) {
        listOf(assetId)
      } else {
        emptyList()
      }

      requestMediaLibraryActionPermission(assetIdList)

      if (assetId != null) {
        CreateAlbum(context, albumName, assetId, copyAsset).execute()
      } else if (initialAssetUri != null) {
        CreateAlbumWithInitialFileUri(context, albumName, initialAssetUri).execute()
      } else {
        null
      }
    }

    AsyncFunction("deleteAlbumsAsync") Coroutine { albumIds: List<String> ->
      requireSystemPermissions()
      val assetIds = getAssetsInAlbums(context, *albumIds.toTypedArray())
      requestMediaLibraryActionPermission(assetIds)
      DeleteAlbums(context, albumIds).execute()
    }

    AsyncFunction("getAssetsAsync") Coroutine { assetOptions: AssetsOptions ->
      requireSystemPermissions(false)
      GetAssets(context, assetOptions).execute()
    }

    AsyncFunction("migrateAlbumIfNeededAsync") Coroutine { albumId: String ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
        return@Coroutine
      }

      val assetsIds = getAssetsInAlbums(context, albumId)
        .filter { it.isNotEmpty() }
        .toTypedArray()
      // The album is empty, nothing to migrate
      if (assetsIds.isEmpty()) {
        return@Coroutine
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
        return@Coroutine
      }

      val needsToCheckPermissions = assets.map { it.assetId }
      requestMediaLibraryActionPermission(needsToCheckPermissions)
      MigrateAlbum(context, assets, albumDir.name).execute()
    }

    AsyncFunction("albumNeedsMigrationAsync") Coroutine { albumId: String ->
      requireSystemPermissions(false)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        CheckIfAlbumShouldBeMigrated(context, albumId).execute()
      }
      false
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

      videosObserver =
        MediaStoreContentObserver(handler, MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO)
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

    RegisterActivityContracts {
      deleteLauncher =
        registerForActivityResult(DeleteContract(this@MediaLibraryModule))
      writeLauncher =
        registerForActivityResult(WriteContract(this@MediaLibraryModule))
    }
  }

  private val isMissingPermissions: Boolean
    get() = hasReadPermissions()

  private val isMissingWritePermission: Boolean
    get() = hasWritePermissions()

  @SuppressLint("InlinedApi")
  private fun getManifestPermissions(
    writeOnly: Boolean,
    granularPermissions: List<GranularPermission>
  ): Array<String> {
    // ACCESS_MEDIA_LOCATION should not be requested if it's absent in android-manifest
    // If only audio permission is requested, we don't need to request media location permissions
    val shouldAddMediaLocationAccess =
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q &&
        MediaLibraryUtils.hasManifestPermission(context, ACCESS_MEDIA_LOCATION) &&
        !(
          Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            granularPermissions.count() == 1 && granularPermissions.contains(
              GranularPermission.AUDIO
            )
          )

    val shouldAddWriteExternalStorage =
      Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU &&
        MediaLibraryUtils.hasManifestPermission(context, WRITE_EXTERNAL_STORAGE)

    val shouldAddGranularPermissions = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
    val shouldIncludeGranular = shouldAddGranularPermissions && !writeOnly

    return listOfNotNull(
      WRITE_EXTERNAL_STORAGE.takeIf { shouldAddWriteExternalStorage },
      READ_EXTERNAL_STORAGE.takeIf { !writeOnly && !shouldAddGranularPermissions },
      ACCESS_MEDIA_LOCATION.takeIf { shouldAddMediaLocationAccess },
      *getGranularPermissions(shouldIncludeGranular, granularPermissions)
    ).toTypedArray()
  }

  @SuppressLint("InlinedApi")
  private fun getGranularPermissions(
    shouldIncludeGranular: Boolean,
    granularPermissions: List<GranularPermission>
  ): Array<String> {
    if (shouldIncludeGranular) {
      assertGranularPermissionIntegrity(context, granularPermissions)
      return listOfNotNull(
        READ_MEDIA_IMAGES.takeIf { granularPermissions.contains(GranularPermission.PHOTO) },
        READ_MEDIA_VIDEO.takeIf { granularPermissions.contains(GranularPermission.VIDEO) },
        READ_MEDIA_AUDIO.takeIf { granularPermissions.contains(GranularPermission.AUDIO) }
      ).toTypedArray()
    }
    return arrayOf()
  }

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  private fun assertGranularPermissionIntegrity(context: Context, granularPermissions: List<GranularPermission>) {
    for (permission in granularPermissions) {
      if (!MediaLibraryUtils.hasManifestPermission(context, permission.toManifestPermission())) {
        throw PermissionsException("You have requested the $permission permission, but it is not declared in AndroidManifest. Update expo-media-library config plugin to include the permission before requesting it.")
      }
    }
  }

  private fun getManifestDeclaredPermissions(context: Context, granularPermissions: List<GranularPermission>): List<GranularPermission> {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      return granularPermissions.filter { MediaLibraryUtils.hasManifestPermission(context, it.toManifestPermission()) }
    }
    return granularPermissions
  }

  private fun requireSystemPermissions(isWritePermissionRequired: Boolean = true) {
    val missingPermissionsCondition =
      if (isWritePermissionRequired) isMissingWritePermission else isMissingPermissions
    if (missingPermissionsCondition) {
      val missingPermissionsMessage =
        if (isWritePermissionRequired) ERROR_NO_WRITE_PERMISSION_MESSAGE else ERROR_NO_PERMISSIONS_MESSAGE
      throw PermissionsException(missingPermissionsMessage)
    }
  }

  private fun hasReadPermissions(): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      val permissions = allowedPermissionsList.map { it.toManifestPermission() }.toMutableList()
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

  private fun maybeThrowIfExpoGo(permissions: List<GranularPermission>) {
    if (isExpoGo) {
      if (permissions.contains(GranularPermission.PHOTO) || permissions.contains(GranularPermission.VIDEO)) {
        throw PermissionsException("Due to changes in Androids permission requirements, Expo Go can no longer provide full access to the media library. To test the full functionality of this module, you can create a development build")
      }
    }
  }

  private fun hasWritePermissions() = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    false
  } else {
    appContext.permissions
      ?.hasGrantedPermissions(WRITE_EXTERNAL_STORAGE)
      ?.not() ?: false
  }

  private suspend fun requestMediaLibraryActionPermission(
    assetIds: List<String>,
    needsDeletePermission: Boolean = false
  ) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      return
    }

    val uris = MediaLibraryUtils.getAssetsUris(context, assetIds)
    val urisWithoutPermission = uris.filterNot { uri ->
      hasWritePermissionForUri(uri)
    }

    if (urisWithoutPermission.isEmpty()) {
      return
    }

    val granted = if (needsDeletePermission) {
      deleteLauncher.launch(DeleteContractInput(uris = urisWithoutPermission))
    } else {
      writeLauncher.launch(WriteContractInput(uris = urisWithoutPermission))
    }

    if (!granted) {
      throw PermissionsException(ERROR_USER_DID_NOT_GRANT_WRITE_PERMISSIONS_MESSAGE)
    }
  }

  private fun hasWritePermissionForUri(uri: Uri): Boolean {
    return context.checkUriPermission(
      uri,
      Binder.getCallingPid(),
      Binder.getCallingUid(),
      Intent.FLAG_GRANT_WRITE_URI_PERMISSION
    ) == PackageManager.PERMISSION_GRANTED
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
}
