package expo.modules.notifications.postoffice;

import android.os.Bundle;

import com.raizlabs.android.dbflow.sql.builder.Condition;
import com.raizlabs.android.dbflow.sql.language.Select;

import org.unimodules.core.interfaces.Function;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import expo.modules.notifications.helpers.Utils;
import expo.modules.notifications.postoffice.pendingdeliveries.PendingForegroundNotification;
import expo.modules.notifications.postoffice.pendingdeliveries.PendingForegroundNotification$Table;
import expo.modules.notifications.postoffice.pendingdeliveries.PendingUserInteraction;
import expo.modules.notifications.postoffice.pendingdeliveries.PendingUserInteraction$Table;

class PostOffice implements ExpoPostOffice {

  private Map<String, Mailbox> mMailBoxes = new HashMap<>();

  @Override
  public void notifyAboutUserInteraction(String appId, Bundle userInteraction) {
    if (mMailBoxes.containsKey(appId)) {
      mMailBoxes.get(appId).onUserInteraction(userInteraction);
    } else {
      addUserInteractionToDatabase(appId, userInteraction);
    }
  }

  @Override
  public void sendForegroundNotification(String appId, Bundle notification) {
    if (mMailBoxes.containsKey(appId)) {
      mMailBoxes.get(appId).onForegroundNotification(notification);
    } else {
      addForegroundNotificationToDatabase(appId, notification);
    }
  }

  @Override
  public void registerModuleAndGetPendingDeliveries(String appId, Mailbox mailbox) {
    mMailBoxes.put(appId, mailbox);

    List<PendingForegroundNotification> pendingForegroundNotificationList = new Select().from(PendingForegroundNotification.class)
        .where(Condition.column(PendingForegroundNotification$Table.APPID).is(appId))
        .queryList();

    List<PendingUserInteraction> pendingUserInteractionList = new Select().from(PendingUserInteraction.class)
        .where(Condition.column(PendingUserInteraction$Table.APPID).is(appId))
        .queryList();

    for (PendingForegroundNotification pendingForegroundNotification : pendingForegroundNotificationList) {
      mailbox.onForegroundNotification(
          Utils.StringToBundle(pendingForegroundNotification.getNotification())
      );
      pendingForegroundNotification.delete();
    }

    for (PendingUserInteraction pendingUserInteraction : pendingUserInteractionList) {
      mailbox.onUserInteraction(
          Utils.StringToBundle(pendingUserInteraction.getUserInteraction())
      );
      pendingUserInteraction.delete();
    }
  }

  @Override
  public void unregisterModule(String appId) {
    mMailBoxes.remove(appId);
  }

  private void addUserInteractionToDatabase(String appId, Bundle userInteraction) {
    PendingUserInteraction pendingUserInteraction = new PendingUserInteraction();
    pendingUserInteraction.setappId(appId);
    pendingUserInteraction.setUserInteraction(Utils.bundleToString(userInteraction));
    pendingUserInteraction.save();
  }

  private void addForegroundNotificationToDatabase(String appId, Bundle notification) {
    PendingForegroundNotification pendingForegroundNotification = new PendingForegroundNotification();
    pendingForegroundNotification.setappId(appId);
    pendingForegroundNotification.setNotification(Utils.bundleToString(notification));
    pendingForegroundNotification.save();
  }

  public void doWeHaveMailboxRegisteredAsAppId(String appId, Function<Boolean, Boolean> completionHandler) {
    completionHandler.apply(mMailBoxes.containsKey(appId));
  }

}
