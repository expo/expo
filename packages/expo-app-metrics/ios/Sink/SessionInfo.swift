// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/// A session and the app and device it runs on, captured when the session starts.
///
/// For expo-observe. Not a stable API.
public struct SessionInfo: Sendable {
  public let id: String
  public let type: Session.SessionType
  public let startDate: Date
  public let app: AppInfo
  public let device: DeviceInfo
  public let languageTag: String?

  static func snapshot(of session: Session) -> SessionInfo {
    return SessionInfo(
      id: session.id,
      type: session.type,
      startDate: session.startDate,
      app: AppInfo.current,
      device: DeviceInfo.current,
      languageTag: Locale.preferredLanguages.first
    )
  }
}
