// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel.services.linking

import android.net.Uri
import host.exp.exponent.Constants
import host.exp.exponent.kernel.KernelConstants.ExperienceOptions
import host.exp.exponent.kernel.KernelProvider

class LinkingKernelService {
  fun openURI(uri: Uri) {
    val manifestUrl =
      if (Constants.isStandaloneApp()) Constants.INITIAL_URL.toString() else uri.toString()
    KernelProvider.instance
      .openExperience(ExperienceOptions(manifestUrl, uri.toString(), null))
  }

  fun canOpenURI(uri: Uri): Boolean {
    val scheme = uri.scheme
    if (scheme == "exp" || scheme == "exps") {
      return true
    }
    if (Constants.SHELL_APP_SCHEME != null && Constants.SHELL_APP_SCHEME == scheme) {
      return true
    }
    val host = uri.host
    return host != null && (host == "exp.host" || host == "exp.direct" || host.endsWith("exp.direct"))
  }
}
