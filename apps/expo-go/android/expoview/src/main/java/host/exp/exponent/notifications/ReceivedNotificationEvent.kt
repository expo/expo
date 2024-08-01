// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.notifications

class ReceivedNotificationEvent(
  experienceScopeKey: String,
  body: String?,
  notificationId: Int,
  isMultiple: Boolean,
  isRemote: Boolean
) : ExponentNotification(experienceScopeKey, body, notificationId, isMultiple, isRemote)
