package expo.modules.application

import android.content.pm.PackageManager
import android.os.RemoteException
import expo.modules.kotlin.exception.CodedException

class ApplicationPackageNameNotFoundException(cause: PackageManager.NameNotFoundException) :
  CodedException(message = "Unable to get install time of this application. Could not get package info or package name.", cause = cause)

// The code is set explicitly, because the one inferred from the class name drops the `_EXCEPTION` suffix.
internal class ApplicationInstallReferrerRemoteException(cause: RemoteException) :
  CodedException(
    "ERR_APPLICATION_INSTALL_REFERRER_REMOTE_EXCEPTION",
    "RemoteException getting install referrer information. This may happen if the process hosting the remote object is no longer available.",
    cause
  )

internal class ApplicationInstallReferrerUnavailableException :
  CodedException("The current Play Store app doesn't provide the installation referrer API, or the Play Store may not be installed.")

internal class ApplicationInstallReferrerException(responseCode: Int) :
  CodedException("General error retrieving the install referrer: response code $responseCode")

internal class ApplicationInstallReferrerServiceDisconnectedException :
  CodedException("Connection to install referrer service was lost.")
