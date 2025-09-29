package expo.modules.medialibrary.next.permissions

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Binder
import android.os.Build
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

  private fun hasWritePermissionForUri(uri: Uri): Boolean =
    runCatching {
      context.contentResolver.openOutputStream(uri, "rw")?.close()
      return true
    }.getOrDefault(false)
}
