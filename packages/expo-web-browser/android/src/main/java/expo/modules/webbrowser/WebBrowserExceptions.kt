package expo.modules.webbrowser

import expo.modules.kotlin.exception.CodedException

internal class NoPreferredPackageFound : CodedException(
  code = "PREFERRED_PACKAGE_NOT_FOUND",
  message = "Cannot determine preferred package without satisfying it",
  cause = null
)

internal class PackageManagerNotFoundException : CodedException("Package Manager not found")

internal class NoMatchingActivityException : CodedException("No matching browser activity found")

internal class NoUrlProvidedException : CodedException("No url provided")

internal class BrowserActivityNotAllowedException(cause: SecurityException) : CodedException(
  message = "The URL couldn't be opened because Android resolved it to an activity that this app isn't allowed to start, " +
    "usually an app that registered a browser activity without exporting it. " +
    "Pass the `browserPackage` option to open the URL in a specific browser, or fall back to `Linking.openURL()`.",
  cause = cause
)
