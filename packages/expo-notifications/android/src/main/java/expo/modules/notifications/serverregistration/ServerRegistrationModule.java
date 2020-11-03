package expo.modules.notifications.serverregistration;

import android.content.Context;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;

public class ServerRegistrationModule extends ExportedModule {
  private static final String EXPORTED_NAME = "NotificationsServerRegistrationModule";

  protected InstallationId mInstallationId;
  private LastRegistrationInfo mLastRegistrationInfo;

  public ServerRegistrationModule(Context context) {
    super(context);
    mInstallationId = new InstallationId(context);
    mLastRegistrationInfo = new LastRegistrationInfo(context);
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
  public void getLastRegistrationInfoAsync(Promise promise) {
    promise.resolve(mLastRegistrationInfo.get());
  }

  @ExpoMethod
  public void setLastRegistrationInfoAsync(String lastRegistrationInfo, Promise promise) {
    mLastRegistrationInfo.set(lastRegistrationInfo);
    promise.resolve(null);
  }
}
