// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// The JS `Session` object. Cached per session, so JS gets the identical object on every call
/// (`getMainSession() === getMainSession()`).
final class SessionObject: SharedObject, @unchecked Sendable {
  let session: Session

  private init(_ session: Session) {
    self.session = session
    super.init()
  }

  static let main = SessionObject(AppMetrics.mainSession)

  // Only the current foreground session is cached: JS gets a new object after it rotates.
  @AppMetricsActor
  private static var foregroundObject: SessionObject?

  /// The object of the current foreground session, or `nil` in the background. Reads the session
  /// and the cache in one actor turn, so a late lookup can't replace a newer session's object.
  static func currentForeground() async throws -> SessionObject? {
    return try await AppMetricsActor.isolated {
      guard let session = AppMetrics.foregroundSession else {
        return nil
      }
      if let cached = foregroundObject, cached.session === session {
        return cached
      }
      let object = SessionObject(session)
      foregroundObject = object
      return object
    }
  }
}
