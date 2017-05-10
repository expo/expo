// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel;

public interface KernelInterface {

  void handleError(String errorMessage);
  void handleError(Exception exception);
  void openExperience(final KernelConstants.ExperienceOptions options);
  boolean reloadVisibleExperience(String manifestUrl);

}
