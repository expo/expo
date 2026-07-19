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
    let scopeFromCategoryId = getScopeAndIdentifierFromScopedIdentifier(identifier).scopeKey
    return scopeFromCategoryId == scopeKey
  }

  static func getUnscopedIdentifier(fromScopedIdentifier: String) -> String {
    let components = getScopeAndIdentifierFromScopedIdentifier(fromScopedIdentifier)
    return components.identifier
  }

  static func getScopeAndIdentifierFromScopedIdentifier(_ scopedIdentifier: String) -> ScopedIdentifierComponents {
    var scope = ""
    var identifier = ""
    let pattern = "^((?:[^/\\\\]|\\\\[/\\\\])*)/((?:[^/\\\\]|\\\\[/\\\\])*)$"

    do {
      let regex = try NSRegularExpression(pattern: pattern, options: [])
      let range = NSRange(location: 0, length: scopedIdentifier.count)

      if let match = regex.firstMatch(in: scopedIdentifier, options: [], range: range) {
        let scopeRange = match.range(at: 1)
        let identifierRange = match.range(at: 2)

        if let scopeSubstring = Range(scopeRange, in: scopedIdentifier) {
          scope = String(scopedIdentifier[scopeSubstring])
        }
        if let identifierSubstring = Range(identifierRange, in: scopedIdentifier) {
          identifier = String(scopedIdentifier[identifierSubstring])
        }
      } else {
        // No delimiter found, so no scope associated with this identifier
        identifier = scopedIdentifier
      }
    } catch {
      // If regex fails, treat as unscoped
      identifier = scopedIdentifier
    }

    return ScopedIdentifierComponents(
      scopeKey: unescapedString(scope),
      identifier: unescapedString(identifier)
    )
  }

  private static func escapedString(_ string: String) -> String {
    return string.replacingOccurrences(of: "\\", with: "\\\\")
      .replacingOccurrences(of: "/", with: "\\/")
  }

  private static func unescapedString(_ string: String) -> String {
    return string.replacingOccurrences(of: "\\/", with: "/")
      .replacingOccurrences(of: "\\\\", with: "\\")
  }
}
