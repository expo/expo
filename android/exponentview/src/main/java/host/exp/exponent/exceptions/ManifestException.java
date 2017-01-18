// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.exceptions;

import host.exp.exponent.Constants;
import host.exp.exponentview.ExponentViewBuildConfig;

public class ManifestException extends ExponentException {

  private String mManifestUrl;

  public ManifestException(final Exception originalException, final String manifestUrl) {
    super(originalException);

    mManifestUrl = manifestUrl;
  }

  @Override
  public String toString() {
    String extraMessage = "";
    if (ExponentViewBuildConfig.DEBUG) {
      // This will get hit in a detached app.
      extraMessage = " Are you sure XDE or exp is running?";
    }

    if (mManifestUrl == null) {
      return "Could not load experience." + extraMessage;
    } else if (mManifestUrl.equals(Constants.INITIAL_URL)) {
      //
      return "Could not load app." + extraMessage;
    } else {
      return "Could not load " + mManifestUrl + "." + extraMessage;
    }
  }
}
