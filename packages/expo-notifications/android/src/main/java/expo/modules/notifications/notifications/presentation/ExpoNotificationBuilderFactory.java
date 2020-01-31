package expo.modules.notifications.notifications.presentation;

import android.content.Context;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.interfaces.InternalModule;

import java.util.Collections;
import java.util.List;

import expo.modules.notifications.notifications.interfaces.NotificationBuilder;
import expo.modules.notifications.notifications.interfaces.NotificationBuilderFactory;
import expo.modules.notifications.notifications.presentation.builders.ExpoNotificationBuilder;

/**
 * {@link NotificationBuilderFactory} returning instances of {@link ExpoNotificationBuilder}.
 */
public class ExpoNotificationBuilderFactory implements InternalModule, NotificationBuilderFactory {
  private ModuleRegistry mModuleRegistry;

  @Override
  public List<? extends Class> getExportedInterfaces() {
    return Collections.singletonList(NotificationBuilderFactory.class);
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @Override
  public NotificationBuilder createBuilder(Context context) {
    return new ExpoNotificationBuilder(context, mModuleRegistry);
  }
}
