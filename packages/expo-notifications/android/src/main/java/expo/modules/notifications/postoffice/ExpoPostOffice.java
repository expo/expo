package expo.modules.notifications.postoffice;

import android.os.Bundle;

import org.unimodules.core.interfaces.Function;

public interface ExpoPostOffice {

  void notifyAboutUserInteraction(String appId, Bundle userInteraction);

  void registerModuleAndGetInitialUserInteraction(String appId, Mailbox mailbox, Function<Bundle, Boolean> callback);

  void unregisterModule(String appId);

  void tryToSendForegroundNotificationToMailbox(String appId, Bundle notification, Function<Boolean, Boolean> completionHandler);

}
