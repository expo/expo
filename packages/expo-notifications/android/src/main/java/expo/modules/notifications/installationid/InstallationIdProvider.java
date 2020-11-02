package expo.modules.notifications.installationid;

import android.content.Context;
import android.os.Bundle;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;

import java.util.Map;

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

  @ExpoMethod
  public void getRegistrationsAsync(Promise promise) {
    Bundle registrations = new Bundle();
    for (Map.Entry<String, Boolean> entry : mInstallationId.getRegistrations().entrySet()) {
      registrations.putBoolean(entry.getKey(), entry.getValue());
    }
    promise.resolve(registrations);
  }

  @ExpoMethod
  public void setRegistrationAsync(String scope, Boolean isRegistered, Promise promise) {
    mInstallationId.setRegistration(scope, isRegistered);
    promise.resolve(null);
  }
}
