package expo.modules.application

import expo.modules.kotlin.exception.CodedException

class UnableToGetInstallationTimeException(cause: Throwable?) : CodedException("Unable to get install time of this application. Could not get package info or package name.", cause)

class UnableToGetLastUpdateTimeException(cause: Throwable?) : CodedException("Unable to get last update time of this application. Could not get package info or package name.", cause)

class ApplicationInstallReferrerRemoteException(cause: Throwable?) : CodedException("RemoteException getting install referrer information. This may happen if the process hosting the remote object is no longer available.", cause)

class ApplicationInstallReferrerUnavailableException : CodedException("The current Play Store app doesn't provide the installation referrer API, or the Play Store may not be installed.")

class ApplicationInstallReferrerConnectionException : CodedException("Could not establish a connection to Google Play.")

class ApplicationInstallReferrerException(responseCode: String) : CodedException("General error retrieving the install referrer: response code $responseCode")

class ApplicationInstallReferrerServiceDisconnectedException : CodedException("Connection to install referrer service was lost.")
