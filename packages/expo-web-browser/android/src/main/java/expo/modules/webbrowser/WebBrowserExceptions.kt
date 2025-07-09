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
