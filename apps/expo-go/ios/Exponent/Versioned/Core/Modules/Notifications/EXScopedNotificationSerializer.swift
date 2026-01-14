// Copyright 2018-present 650 Industries. All rights reserved.

import UserNotifications
import ExpoNotifications

public class EXScopedNotificationSerializer {

    public static func serializedNotification(_ notification: UNNotification) -> NotificationRecord {
        let scopedSerializedNotification = NotificationRecord(from: notification)
        scopedSerializedNotification.request = serializedNotificationRequest(notification.request)

        return scopedSerializedNotification
    }

    public static func serializedNotificationContent(_ request: UNNotificationRequest) -> NotificationContentRecord {
        let scopedSerializedContent = NotificationContentRecord(from: request)

        let categoryIdentifier = request.content.categoryIdentifier
        if (!categoryIdentifier.isEmpty) {
            let unscopedCategoryId = EXScopedNotificationsUtils.getScopeAndIdentifierFromScopedIdentifier(categoryIdentifier).identifier
            scopedSerializedContent.categoryIdentifier = unscopedCategoryId
        } else {
            scopedSerializedContent.categoryIdentifier = nil
        }

        return scopedSerializedContent
    }

    public static func serializedNotificationRequest(_ request: UNNotificationRequest) -> NotificationRequestRecord {
        let scopedSerializedRequest = NotificationRequestRecord(from: request)
        scopedSerializedRequest.identifier = EXScopedNotificationsUtils.getScopeAndIdentifierFromScopedIdentifier(request.identifier).identifier
        scopedSerializedRequest.content = serializedNotificationContent(request)

        return scopedSerializedRequest
    }
}
