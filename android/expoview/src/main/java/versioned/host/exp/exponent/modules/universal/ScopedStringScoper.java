package versioned.host.exp.exponent.modules.universal;

import expo.modules.notifications.helpers.scoper.BareStringScoper;

public class ScopedStringScoper extends BareStringScoper {

  private String experienceId = "";

  public ScopedStringScoper(String experienceId) {
    this.experienceId = experienceId;
  }

  @Override
  public String getScopedString(String s) {
    return experienceId + ":" + s;
  }

}
