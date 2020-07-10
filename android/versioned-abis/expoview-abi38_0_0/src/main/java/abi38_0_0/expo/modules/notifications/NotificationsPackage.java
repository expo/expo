package abi38_0_0.expo.modules.notifications;

import android.content.Context;

import org.unimodules.core.interfaces.SingletonModule;

import java.util.Arrays;
import java.util.List;

import abi38_0_0.expo.modules.notifications.badge.BadgeModule;
import abi38_0_0.expo.modules.notifications.badge.ExpoBadgeManager;
import abi38_0_0.expo.modules.notifications.installationid.InstallationIdProvider;
import abi38_0_0.expo.modules.notifications.notifications.channels.NotificationChannelGroupManagerModule;
import abi38_0_0.expo.modules.notifications.notifications.channels.NotificationChannelManagerModule;
import abi38_0_0.expo.modules.notifications.notifications.emitting.NotificationsEmitter;
import abi38_0_0.expo.modules.notifications.notifications.handling.NotificationsHandler;
import abi38_0_0.expo.modules.notifications.notifications.presentation.ExpoNotificationPresentationModule;
import abi38_0_0.expo.modules.notifications.notifications.scheduling.NotificationScheduler;
import abi38_0_0.expo.modules.notifications.permissions.NotificationPermissionsModule;
import abi38_0_0.expo.modules.notifications.tokens.PushTokenManager;
import abi38_0_0.expo.modules.notifications.tokens.PushTokenModule;
import abi38_0_0.org.unimodules.core.BasePackage;
import abi38_0_0.org.unimodules.core.ExportedModule;
import expo.modules.notifications.ExpoNotificationsReconstructor;
import expo.modules.notifications.notifications.NotificationManager;
import expo.modules.notifications.notifications.service.NotificationsHelper;

public class NotificationsPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    NotificationsHelper notificationsHelper = new NotificationsHelper(context, new ExpoNotificationsReconstructor());
    return Arrays.asList(
      new BadgeModule(context),
      new PushTokenModule(context),
      new NotificationsEmitter(context),
      new NotificationsHandler(context, notificationsHelper),
      new NotificationScheduler(context),
      new InstallationIdProvider(context),
      new NotificationPermissionsModule(context),
      new NotificationChannelManagerModule(context),
      new ExpoNotificationPresentationModule(context, notificationsHelper),
      new NotificationChannelGroupManagerModule(context)
    );
  }

  @Override
  public List<SingletonModule> createSingletonModules(Context context) {
    return Arrays.asList(
      new PushTokenManager(),
      new NotificationManager(),
      new ExpoBadgeManager(context)
    );
  }
}
