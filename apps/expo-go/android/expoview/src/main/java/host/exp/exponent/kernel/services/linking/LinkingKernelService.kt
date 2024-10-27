// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel.services.linking

import android.net.Uri
import host.exp.exponent.kernel.KernelConstants.ExperienceOptions
import host.exp.exponent.kernel.KernelProvider

class LinkingKernelService {
  fun openURI(uri: Uri) {
    val manifestUrl = uri.toString()
    KernelProvider.instance
      .openExperience(ExperienceOptions(manifestUrl, uri.toString(), null))
  }

  fun canOpenURI(uri: Uri): Boolean {
    val scheme = uri.scheme
    if (scheme == "exp" || scheme == "exps") {
      return true
    }
    val host = uri.host
    return host != null && (host == "exp.host" || host == "exp.direct" || host.endsWith("exp.direct"))
  }
}
