package expo.modules.notifications.postoffice;

import android.os.Bundle;

import org.unimodules.core.interfaces.Function;

public interface ExpoPostOffice {

  void notifyAboutUserInteraction(String appId, Bundle userInteraction);

  void sendForegroundNotification(String appId, Bundle notification);

  void registerModuleAndGetPendingDeliveries(String appId, Mailbox mailbox);

  void unregisterModule(String appId);

  void doWeHaveMailboxRegisteredAsAppId(String appId, Function<Boolean, Boolean> completionHandler);

}
