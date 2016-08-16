// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.exceptions;

import host.exp.exponent.Constants;

public class ManifestException extends ExponentException {

  private String mManifestUrl;

  public ManifestException(final Exception originalException, final String manifestUrl) {
    super(originalException);

    mManifestUrl = manifestUrl;
  }

  @Override
  public String toString() {
    if (mManifestUrl == null) {
      return "Could not load experience.";
    } else if (mManifestUrl.equals(Constants.INITIAL_URL)) {
      //
      return "Could not load app.";
    } else {
      return "Could not load " + mManifestUrl + ".";
    }
  }
}
