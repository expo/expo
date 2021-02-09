package abi38_0_0.expo.modules.notifications.installationid;

import android.content.Context;

import abi38_0_0.org.unimodules.core.ExportedModule;
import abi38_0_0.org.unimodules.core.Promise;
import abi38_0_0.org.unimodules.core.interfaces.ExpoMethod;

public class InstallationIdProvider extends ExportedModule {
  private static final String EXPORTED_NAME = "NotificationsInstallationIdProvider";

  private InstallationId mInstallationId;

  public InstallationIdProvider(Context context) {
    super(context);
    mInstallationId = new InstallationId(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  @ExpoMethod
  public void getInstallationIdAsync(Promise promise) {
    promise.resolve(mInstallationId.getId());
  }
}
