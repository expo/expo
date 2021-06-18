// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.notifications;

public class ReceivedNotificationEvent extends ExponentNotification {
  public ReceivedNotificationEvent(String experienceScopeKey, String body, int notificationId, boolean isMultiple, boolean isRemote) {
    super(experienceScopeKey, body, notificationId, isMultiple, isRemote);
  }
}
