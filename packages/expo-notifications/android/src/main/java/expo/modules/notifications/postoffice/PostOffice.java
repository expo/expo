package expo.modules.notifications.postoffice;

import android.os.Bundle;

import com.raizlabs.android.dbflow.sql.language.Select;

import org.unimodules.core.interfaces.Function;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import expo.modules.notifications.helpers.Utils;
import expo.modules.notifications.postoffice.pendingdeliveries.PendingUserInteraction;
import expo.modules.notifications.postoffice.pendingdeliveries.PendingUserInteraction_Table;

class PostOffice implements ExpoPostOffice {

  private Map<String, Mailbox> mMailBoxes = new HashMap<>();
  private Map<String, List<Bundle>> mPendingUserInteractions = new HashMap();

  @Override
  public void notifyAboutUserInteraction(String appId, Bundle userInteraction) {
    if (mMailBoxes.containsKey(appId)) {
      mMailBoxes.get(appId).onUserInteraction(userInteraction);
    } else {
      addUserInteraction(appId, userInteraction);
    }
  }

  private void addUserInteraction(String appId, Bundle userInteraction) {
    if (!mPendingUserInteractions.containsKey(appId)) {
      mPendingUserInteractions.put(appId, new ArrayList<>());
    }
    mPendingUserInteractions.get(appId).add(userInteraction);
  }

  @Override
  public void registerModuleAndFlushPendingUserInteractions(String appId, Mailbox mailbox) {
    mMailBoxes.put(appId, mailbox);
    List<Bundle> pendingUserInteractions = mPendingUserInteractions.get(appId);
    if (pendingUserInteractions == null) {
      return;
    }

    for (Bundle userInteraction : pendingUserInteractions) {
      mailbox.onUserInteraction(userInteraction);
    }
  }

  @Override
  public void unregisterModule(String appId) {
    mMailBoxes.remove(appId);
  }

  public void tryToSendForegroundNotificationToMailbox(String appId, Bundle notification, Function<Boolean, Boolean> completionHandler) {
    if (mMailBoxes.containsKey(appId)) {
      mMailBoxes.get(appId).onForegroundNotification(notification);
    } else {
      completionHandler.apply(mMailBoxes.containsKey(appId));
    }
  }

}
