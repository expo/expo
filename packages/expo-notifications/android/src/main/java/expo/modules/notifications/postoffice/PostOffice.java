package expo.modules.notifications.postoffice;

import android.os.Bundle;

import com.raizlabs.android.dbflow.sql.language.Select;

import org.unimodules.core.interfaces.Function;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import expo.modules.notifications.helpers.Utils;
import expo.modules.notifications.postoffice.pendingdeliveries.PendingUserInteraction;
import expo.modules.notifications.postoffice.pendingdeliveries.PendingUserInteraction_Table;

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
  public void registerModuleAndGetInitialUserInteraction(String appId, Mailbox mailbox, Function<Bundle, Boolean> callback) {
    mMailBoxes.put(appId, mailbox);

    List<PendingUserInteraction> pendingUserInteractionList = new Select().from(PendingUserInteraction.class)
        .where(PendingUserInteraction_Table.appId.eq(appId))
        .queryList();

    if (pendingUserInteractionList.size() == 0) {
      callback.apply(null);
    } else {
      PendingUserInteraction lastPendingUserInteraction = pendingUserInteractionList.get(pendingUserInteractionList.size() - 1);;
      Bundle initialUserInteraction = Utils.StringToBundle(lastPendingUserInteraction.getUserInteraction());
      callback.apply(initialUserInteraction);
    }

    for (PendingUserInteraction pendingUserInteraction : pendingUserInteractionList) {
      pendingUserInteraction.delete();
    }
  }

  @Override
  public void unregisterModule(String appId) {
    mMailBoxes.remove(appId);
  }

  private void addUserInteractionToDatabase(String appId, Bundle userInteraction) {
    PendingUserInteraction pendingUserInteraction = new PendingUserInteraction();
    pendingUserInteraction.setAppId(appId);
    pendingUserInteraction.setUserInteraction(Utils.bundleToString(userInteraction));
    pendingUserInteraction.save();
  }

  public void tryToSendForegroundNotificationToMailbox(String appId, Bundle notification, Function<Boolean, Boolean> completionHandler) {
    if (mMailBoxes.containsKey(appId)) {
      mMailBoxes.get(appId).onForegroundNotification(notification);
    } else {
      completionHandler.apply(mMailBoxes.containsKey(appId));
    }
  }

}
