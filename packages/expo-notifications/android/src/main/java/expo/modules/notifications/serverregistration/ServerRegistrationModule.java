package expo.modules.notifications.serverregistration;

import android.content.Context;

import expo.modules.core.ExportedModule;
import expo.modules.core.Promise;
import expo.modules.core.interfaces.ExpoMethod;

public class ServerRegistrationModule extends ExportedModule {
  private static final String EXPORTED_NAME = "NotificationsServerRegistrationModule";

  protected InstallationId mInstallationId;
  private RegistrationInfo mRegistrationInfo;

  public ServerRegistrationModule(Context context) {
    super(context);
    mInstallationId = new InstallationId(context);
    mRegistrationInfo = new RegistrationInfo(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  @ExpoMethod
  public void getInstallationIdAsync(Promise promise) {
    promise.resolve(mInstallationId.getOrCreateUUID());
  }

  @ExpoMethod
  public void getRegistrationInfoAsync(Promise promise) {
    promise.resolve(mRegistrationInfo.get());
  }

  @ExpoMethod
  public void setRegistrationInfoAsync(String registrationInfo, Promise promise) {
    mRegistrationInfo.set(registrationInfo);
    promise.resolve(null);
  }
}
