// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel.services.linking;

import android.net.Uri;

import host.exp.exponent.Constants;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.kernel.KernelProvider;

public class LinkingKernelService {

  public LinkingKernelService() {
  }

  public void openURI(Uri uri) {
    KernelProvider.getInstance().openExperience(
        new KernelConstants.ExperienceOptions(uri.toString(), uri.toString(), null)
    );
  }

  public boolean canOpenURI(Uri uri) {
    String scheme = uri.getScheme();
    if ("exp".equals(scheme) || "exps".equals(scheme)) {
      return true;
    }

    if (Constants.SHELL_APP_SCHEME != null && Constants.SHELL_APP_SCHEME.equals(scheme)) {
      return true;
    }

    String host = uri.getHost();

    return "exp.host".equals(host) || host.endsWith("exp.direct");
  }
}
