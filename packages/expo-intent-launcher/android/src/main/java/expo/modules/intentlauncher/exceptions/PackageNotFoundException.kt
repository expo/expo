package expo.modules.intentlauncher.exceptions

import expo.modules.core.errors.CodedException

class PackageNotFoundException(packageName: String) :
  CodedException("Package not found: $packageName") {
  override fun getCode(): String {
    return "E_PACKAGE_NOT_FOUND"
  }
}
