package expo.modules.notifications;

import android.content.Context;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.unimodules.core.BasePackage;
import org.unimodules.core.ExportedModule;
import org.unimodules.core.ViewManager;
import org.unimodules.core.interfaces.InternalModule;

import expo.modules.notifications.helpers.provider.BareAppIdProvider;
import expo.modules.notifications.helpers.scoper.BareStringScoper;

public class NotificationsPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList(new NotificationsModule(context));
  }

  @Override
  public List<ViewManager> createViewManagers(Context context) {
    return Collections.emptyList();
  }

  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Arrays.asList(
            new BareAppIdProvider(context),
            new BareStringScoper()
    );
  }
}
