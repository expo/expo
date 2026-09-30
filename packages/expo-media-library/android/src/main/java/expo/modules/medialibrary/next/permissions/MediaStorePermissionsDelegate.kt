package expo.modules.medialibrary.next.permissions

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.MediaStore
import androidx.annotation.RequiresApi
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.activityresult.AppContextActivityResultCaller
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.providers.AppContextProvider
import expo.modules.medialibrary.ERROR_USER_DID_NOT_GRANT_WRITE_PERMISSIONS_MESSAGE
import expo.modules.medialibrary.PermissionsException
import expo.modules.medialibrary.next.permissions.contracts.DeleteContract
import expo.modules.medialibrary.next.permissions.contracts.DeleteContractInput
import expo.modules.medialibrary.next.permissions.contracts.WriteContract
import expo.modules.medialibrary.next.permissions.contracts.WriteContractInput

class MediaStorePermissionsDelegate(val appContext: AppContext) {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private lateinit var deleteLauncher: AppContextActivityResultLauncher<DeleteContractInput, Boolean>
  private lateinit var writeLauncher: AppContextActivityResultLauncher<WriteContractInput, Boolean>

  @RequiresApi(Build.VERSION_CODES.R)
  suspend fun launchMediaStoreDeleteRequest(uris: List<Uri>) {
    val granted = deleteLauncher.launch(DeleteContractInput(uris.toList()))
    if (!granted) {
      throw PermissionsException(ERROR_USER_DID_NOT_GRANT_WRITE_PERMISSIONS_MESSAGE)
    }
  }

  suspend fun requestMediaLibraryWritePermission(uris: Iterable<Uri>) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      return
    }
    val urisWithoutPermission = uris.filterNot { uri ->
      hasWritePermissionForUri(uri)
    }
    // Launching MediaStore.createWriteRequest with empty array returns granted = false
    if (urisWithoutPermission.isEmpty()) {
      return
    }
    val granted = writeLauncher.launch(WriteContractInput(uris = urisWithoutPermission))
    if (!granted) {
      throw PermissionsException(ERROR_USER_DID_NOT_GRANT_WRITE_PERMISSIONS_MESSAGE)
    }
  }

  suspend fun AppContextActivityResultCaller.registerMediaStoreContracts(appContextProvider: AppContextProvider) {
    deleteLauncher = registerForActivityResult(DeleteContract(appContextProvider))
    writeLauncher = registerForActivityResult(WriteContract(appContextProvider))
  }

  // Don't test write access by opening the file for writing: closing it makes
  // MediaProvider scan the file in the background. When the asset is moved right
  // after the check, that scan can run after the rename, find the old path empty
  // and delete the asset's row, so the moved file disappears from the library.
  @RequiresApi(Build.VERSION_CODES.R)
  private fun hasWritePermissionForUri(uri: Uri): Boolean =
    isOwnedByApp(uri) ||
      context.checkUriPermission(
        uri,
        Process.myPid(),
        Process.myUid(),
        Intent.FLAG_GRANT_WRITE_URI_PERMISSION
      ) == PackageManager.PERMISSION_GRANTED

  // Apps can modify the media they created without a write request.
  @RequiresApi(Build.VERSION_CODES.R)
  private fun isOwnedByApp(uri: Uri): Boolean =
    runCatching {
      context.contentResolver
        .query(uri, arrayOf(MediaStore.MediaColumns.OWNER_PACKAGE_NAME), null, null, null)
        ?.use { cursor -> cursor.moveToFirst() && cursor.getString(0) == context.packageName }
        ?: false
    }.getOrDefault(false)
}
