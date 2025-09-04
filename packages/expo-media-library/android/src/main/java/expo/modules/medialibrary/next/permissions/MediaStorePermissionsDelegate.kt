package expo.modules.medialibrary.next.permissions

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Binder
import android.os.Build
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

  suspend fun requestMediaLibraryActionPermission(uris: Iterable<Uri>, needsDeletePermission: Boolean = false) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      return
    }
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

  suspend fun AppContextActivityResultCaller.registerMediaStoreContracts(appContextProvider: AppContextProvider) {
    deleteLauncher = registerForActivityResult(DeleteContract(appContextProvider))
    writeLauncher = registerForActivityResult(WriteContract(appContextProvider))
  }

  private fun hasWritePermissionForUri(uri: Uri): Boolean {
    return context.checkUriPermission(
      uri,
      Binder.getCallingPid(),
      Binder.getCallingUid(),
      Intent.FLAG_GRANT_WRITE_URI_PERMISSION
    ) == PackageManager.PERMISSION_GRANTED
  }
}
