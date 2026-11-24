// Copyright 2018-present 650 Industries. All rights reserved.

import UserNotifications

// MARK: - ScopedIdentifierComponents

public struct ScopedIdentifierComponents {
  let scopeKey: String
  let identifier: String
}

// MARK: - EXScopedNotificationsUtils

public class EXScopedNotificationsUtils {

  static func shouldNotificationRequest(_ request: UNNotificationRequest, beHandledByExperience scopeKey: String) -> Bool {
    let notificationScopeKey = request.content.userInfo["experienceId"] as? String
    if notificationScopeKey == nil {
      return true
    }
    return notificationScopeKey == scopeKey
  }

  static func shouldNotification(_ notification: UNNotification, beHandledByExperience scopeKey: String) -> Bool {
    return shouldNotificationRequest(notification.request, beHandledByExperience: scopeKey)
  }

  static func scopedIdentifier(fromId unscopedId: String, forExperience scopeKey: String) -> String {
    let scope = escapedString(scopeKey)
    let escapedCategoryId = escapedString(unscopedId)
    return "\(scope)/\(escapedCategoryId)"
  }

  static func isId(_ identifier: String, scopedByExperience scopeKey: String) -> Bool {
    guard let components = parseScopedIdentifier(identifier) else {
      return false
    }
    return components.scopeKey.utf16.elementsEqual(scopeKey.utf16)
  }

  static func getUnscopedIdentifier(fromScopedIdentifier: String) -> String {
    let components = getScopeAndIdentifierFromScopedIdentifier(fromScopedIdentifier)
    return components.identifier
  }

  static func getScopeAndIdentifierFromScopedIdentifier(_ scopedIdentifier: String) -> ScopedIdentifierComponents {
    return parseScopedIdentifier(scopedIdentifier) ?? ScopedIdentifierComponents(
      scopeKey: "",
      identifier: unescapedString(scopedIdentifier)
    )
  }

  private static func parseScopedIdentifier(_ scopedId: String) -> ScopedIdentifierComponents? {
    let utf16 = scopedId.utf16
    let stored = scopedId as NSString
    let slash = UInt16(UInt8(ascii: "/"))
    var match: ScopedIdentifierComponents?

    for (offset, unit) in utf16.enumerated() where unit == slash {
      let scope = unescapedString(stored.substring(to: offset))
      let identifier = unescapedString(stored.substring(from: offset + 1))
      let encoded = scopedIdentifier(fromId: identifier, forExperience: scope)
      guard encoded.utf16.elementsEqual(utf16) else {
        continue
      }
      guard match == nil else {
        return nil
      }
      match = ScopedIdentifierComponents(scopeKey: scope, identifier: identifier)
    }

    return match
  }

  private static func escapedString(_ string: String) -> String {
    return string.replacingOccurrences(of: "\\", with: "\\\\")
      .replacingOccurrences(of: "/", with: "\\/")
  }

  private static func unescapedString(_ string: String) -> String {
    return string.replacingOccurrences(of: "\\/", with: "/", options: .literal)
      .replacingOccurrences(of: "\\\\", with: "\\", options: .literal)
  }
}
