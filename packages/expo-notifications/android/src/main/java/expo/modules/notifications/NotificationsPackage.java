package expo.modules.notifications;

import android.content.Context;

import org.unimodules.core.BasePackage;
import org.unimodules.core.ExportedModule;
import org.unimodules.core.interfaces.InternalModule;
import org.unimodules.core.interfaces.SingletonModule;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import expo.modules.notifications.installationid.InstallationIdProvider;
import expo.modules.notifications.notifications.NotificationManager;
import expo.modules.notifications.notifications.channels.ExpoNotificationChannelsManager;
import expo.modules.notifications.notifications.emitting.NotificationsEmitter;
import expo.modules.notifications.notifications.handling.NotificationsHandler;
import expo.modules.notifications.notifications.presentation.ExpoNotificationBuilderFactory;
import expo.modules.notifications.notifications.presentation.ExpoNotificationPresentationModule;
import expo.modules.notifications.permissions.NotificationPermissionsModule;
import expo.modules.notifications.tokens.PushTokenManager;
import expo.modules.notifications.tokens.PushTokenModule;

public class NotificationsPackage extends BasePackage {
  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Collections.singletonList((InternalModule) new ExpoNotificationBuilderFactory());
  }

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Arrays.asList(
        new PushTokenModule(context),
        new NotificationsEmitter(context),
        new NotificationsHandler(context),
        new InstallationIdProvider(context),
        new NotificationPermissionsModule(context),
        new ExpoNotificationPresentationModule(context)
    );
  }

  @Override
  public List<SingletonModule> createSingletonModules(Context context) {
    return Arrays.asList(
        new PushTokenManager(),
        new NotificationManager(),
        new ExpoNotificationChannelsManager(context)
    );
  }
}
