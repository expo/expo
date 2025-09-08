package expo.modules.medialibrary.next.permissions

import android.Manifest
import android.Manifest.permission.ACCESS_MEDIA_LOCATION
import android.Manifest.permission.READ_EXTERNAL_STORAGE
import android.Manifest.permission.READ_MEDIA_AUDIO
import android.Manifest.permission.READ_MEDIA_IMAGES
import android.Manifest.permission.READ_MEDIA_VIDEO
import android.Manifest.permission.WRITE_EXTERNAL_STORAGE
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import expo.modules.interfaces.permissions.Permissions.askForPermissionsWithPermissionsManager
import expo.modules.interfaces.permissions.Permissions.getPermissionsWithPermissionsManager
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.R
import expo.modules.medialibrary.next.exceptions.PermissionException
import expo.modules.medialibrary.next.permissions.enums.GranularPermission
import java.lang.ref.WeakReference

class SystemPermissionsDelegate(private val appContext: AppContext) {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  /**
   * On Android the system for media library permissions changed in 4 main stages:
   * - Until API 29: WRITE_EXTERNAL_STORAGE and READ_EXTERNAL_STORAGE were required for all operations on assets.
   * - API 30: WRITE_EXTERNAL_STORAGE deprecated; write operations use MediaStore requests.
   * - API 33: READ_EXTERNAL_STORAGE deprecated; replaced by granular permissions (READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, READ_MEDIA_AUDIO).
   * - API 34: Selective media access introduced (READ_MEDIA_VISUAL_USER_SELECTED) allowing apps to access only user-chosen media.
   */
  fun requireSystemPermissions(isWritePermissionNeeded: Boolean) {
    val permissions = when {
      isWriteExternalStorageNotDeprecated() && isWritePermissionNeeded -> listOf(WRITE_EXTERNAL_STORAGE)
      isGranularPermissionsIntroduced() -> buildList {
        addAll(allowedPermissionsList.map { it.toManifestPermission() })
        if (isSelectivePermissionsIntroduced()) add(Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED)
      }
      else -> listOf(READ_EXTERNAL_STORAGE)
    }
    val missing = permissions.any {
      appContext.permissions?.hasGrantedPermissions(it) != true
    }
    if (missing) {
      throw PermissionException("Missing required system permissions")
    }
  }

  fun requestPermissions(writeOnly: Boolean, permissions: List<GranularPermission>?, promise: Promise) {
    val granularPermissions = permissions ?: allowedPermissionsList
    maybeThrowIfExpoGo(granularPermissions)
    askForPermissionsWithPermissionsManager(
      appContext.permissions,
      MediaLibraryPermissionPromiseWrapper(granularPermissions, promise, WeakReference(context)),
      *getManifestPermissions(writeOnly, granularPermissions)
    )
  }

  fun getPermissions(writeOnly: Boolean, permissions: List<GranularPermission>?, promise: Promise) {
    val granularPermissions = permissions ?: allowedPermissionsList
    maybeThrowIfExpoGo(granularPermissions)
    getPermissionsWithPermissionsManager(
      appContext.permissions,
      MediaLibraryPermissionPromiseWrapper(granularPermissions, promise, WeakReference(context)),
      *getManifestPermissions(writeOnly, granularPermissions)
    )
  }

  private fun isWriteExternalStorageNotDeprecated() = Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q
  private fun isGranularPermissionsIntroduced() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
  private fun isSelectivePermissionsIntroduced() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE

  private val isExpoGo by lazy {
    context.resources.getString(R.string.is_expo_go).toBoolean()
  }

  private fun maybeThrowIfExpoGo(permissions: List<GranularPermission>) {
    if (isExpoGo) {
      if (permissions.contains(GranularPermission.PHOTO) || permissions.contains(GranularPermission.VIDEO)) {
        throw PermissionException("Due to changes in Androids permission requirements, Expo Go can no longer provide full access to the media library. To test the full functionality of this module, you can create a development build")
      }
    }
  }

  private val allowedPermissionsList by lazy {
    if (isExpoGo) {
      listOf(GranularPermission.AUDIO)
    } else {
      getManifestDeclaredPermissions(
        context,
        listOf(GranularPermission.PHOTO, GranularPermission.VIDEO, GranularPermission.AUDIO)
      )
    }
  }

  private fun getManifestDeclaredPermissions(
    context: Context,
    granularPermissions: List<GranularPermission>
  ): List<GranularPermission> {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      return granularPermissions.filter { hasManifestPermission(context, it.toManifestPermission()) }
    }
    return granularPermissions
  }

  /**
   * Checks, whenever an application represented by [context] contains specific [permission]
   * in `AndroidManifest.xml`:
   * ```xml
   *  <uses-permission android:name="<<PERMISSION STRING HERE>>" />
   *  ```
   */
  private fun hasManifestPermission(context: Context, permission: String): Boolean =
    getManifestPermissions(context).contains(permission)

  private fun getManifestPermissions(context: Context): Set<String> {
    return try {
      val packageInfo = context.packageManager
        .getPackageInfo(context.packageName, PackageManager.GET_PERMISSIONS)
      packageInfo.requestedPermissions?.toSet() ?: emptySet()
    } catch (e: PackageManager.NameNotFoundException) {
      emptySet()
    }
  }

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

  private fun assertGranularPermissionIntegrity(context: Context, granularPermissions: List<GranularPermission>) {
    for (permission in granularPermissions) {
      if (!hasManifestPermission(context, permission.toManifestPermission())) {
        throw PermissionException("You have requested the $permission permission, but it is not declared in AndroidManifest. Update expo-media-library config plugin to include the permission before requesting it.")
      }
    }
  }
}
