// Copyright 2015-present 650 Industries. All rights reserved.

class DevMenuExpoSessionDelegate {
  private static let sessionKey = "expo-dev-menu.session"
  private static let userLoginEvent = "expo.dev-menu.user-login"
  private static let userLogoutEvent = "expo.dev-menu.user-logout"

  private let manager: DevMenuManager

  init(manager: DevMenuManager) {
    self.manager = manager
  }

  func setSessionAsync(_ session: [String: Any]?) throws {
    var sessionSecret: String?

    if session != nil {
      guard let castedSessionSecret = session!["sessionSecret"] as? String else {
        throw NSError(
          domain: NSExceptionName.invalidArgumentException.rawValue,
          code: 0,
          userInfo: [
            NSLocalizedDescriptionKey: "'sessionSecret' cannot be null."
          ]
        )
      }
      sessionSecret = castedSessionSecret
    }

    setSesssionSecret(sessionSecret)
    UserDefaults.standard.set(session, forKey: DevMenuExpoSessionDelegate.sessionKey)
  }

  @discardableResult
  func restoreSession() -> [String: Any]? {
    guard let session = UserDefaults.standard.dictionary(forKey: DevMenuExpoSessionDelegate.sessionKey) else {
      return nil
    }

    setSesssionSecret(session["sessionSecret"] as? String)
    return session
  }

  private func setSesssionSecret(_ sessionSecret: String?) {
    let wasLoggedIn = manager.expoApiClient.isLoggedIn()
    manager.expoApiClient.setSessionSecret(sessionSecret)
    let isLoggedIn = manager.expoApiClient.isLoggedIn()

    if !wasLoggedIn && isLoggedIn {
      manager.sendEventToDelegateBridge(DevMenuExpoSessionDelegate.userLoginEvent, data: nil)
    } else if wasLoggedIn && !isLoggedIn {
      manager.sendEventToDelegateBridge(DevMenuExpoSessionDelegate.userLogoutEvent, data: nil)
    }
  }
}
