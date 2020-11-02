package expo.modules.notifications.serverregistration;

import android.content.Context;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;

public class ServerRegistrationModule extends ExportedModule {
  private static final String EXPORTED_NAME = "NotificationsServerRegistrationModule";

  protected InstallationId mInstallationId;

  public ServerRegistrationModule(Context context) {
    super(context);
    mInstallationId = new InstallationId(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  @ExpoMethod
  public void getInstallationIdAsync(Promise promise) {
    promise.resolve(mInstallationId.getOrCreateUUID());
  }
}
