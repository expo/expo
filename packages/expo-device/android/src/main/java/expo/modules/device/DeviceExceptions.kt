package expo.modules.device

import expo.modules.kotlin.exception.CodedException

internal class MissingRequestInstallPackagesPermissionException(cause: Throwable) :
  CodedException(
    "Device.isSideLoadingEnabledAsync() could not read whether sideloading is allowed, because " +
      "Android refuses the check to apps that do not declare the REQUEST_INSTALL_PACKAGES " +
      "permission. Add `<uses-permission android:name=\"android.permission.REQUEST_INSTALL_PACKAGES\" />` " +
      "to your AndroidManifest.xml (in a config plugin, or app.json under android.permissions) if your " +
      "app installs APKs. Note that Google Play restricts this permission to apps whose core purpose is installing " +
      "other apps.",
    cause
  )
