package expo.modules.webbrowser

import expo.modules.kotlin.exception.CodedException

internal class NoPreferredPackageFound(
  message: String?
) : CodedException(code = "PREFERRED_PACKAGE_NOT_FOUND", message, cause = null)

internal class PackageManagerNotFoundException : CodedException("Package Manager not found")

internal class NoMatchingActivityException : CodedException("No matching browser activity found")