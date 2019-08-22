package versioned.host.exp.exponent.modules.api.notifications;

import android.content.Context;
import android.util.Log;

import org.unimodules.core.BasePackage;
import org.unimodules.core.ExportedModule;

import java.util.Collections;
import java.util.List;
import java.util.Map;

public class NotificationBackgroundPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new NotificationBackgroundModule(context));
  }
}
