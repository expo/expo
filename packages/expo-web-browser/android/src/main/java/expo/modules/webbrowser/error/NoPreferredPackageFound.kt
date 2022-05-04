package expo.modules.webbrowser.error

import expo.modules.core.errors.CodedException

class NoPreferredPackageFound(message: String?) : CodedException(message) {
  override fun getCode(): String = "PREFERRED_PACKAGE_NOT_FOUND"
}
