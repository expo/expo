package host.exp.exponent.notifications.backgroundActions;

import android.content.Context;

import org.unimodules.core.BasePackage;
import org.unimodules.core.ExportedModule;

import java.util.Collections;
import java.util.List;

public class NotificationBackgroundPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new NotificationBackgroundModule(context));
  }
}
