package versioned.host.exp.exponent.modules.universal;

import expo.modules.notifications.helpers.provider.BareAppIdProvider;

public class ScopedAppIdProvider extends BareAppIdProvider {

  private String experienceId = "";

  public ScopedAppIdProvider(String experienceId) {
    this.experienceId = experienceId;
  }

  @Override
  public String getAppId() {
    return this.experienceId;
  }

}
