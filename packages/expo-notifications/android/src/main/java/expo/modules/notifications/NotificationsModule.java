package expo.modules.notifications;

import java.util.Map;

import android.content.Context;

import java.util.Map;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;

public class NotificationsModule extends ExportedModule {
  private static final String NAME = "ExpoNotifications";
  private static final String TAG = NotificationsModule.class.getSimpleName();

  private ModuleRegistry mModuleRegistry;

  public NotificationsModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }
}
