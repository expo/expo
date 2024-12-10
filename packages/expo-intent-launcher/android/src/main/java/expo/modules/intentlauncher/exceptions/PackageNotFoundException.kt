package expo.modules.intentlauncher.exceptions

import expo.modules.kotlin.exception.CodedException

class PackageNotFoundException(packageName: String) :
  CodedException(message = "Package not found: $packageName")
