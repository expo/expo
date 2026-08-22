import ExpoModulesCore
import Foundation

/// Thrown when the persisted invocation queue cannot be read or written.
internal final class AppIntentQueueException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    return param
  }
}

/// UserDefaults-backed persistence for intent invocations.
internal final class AppIntentInvocationStore {
  /// The value has been chosen arbitrarily, but is comfortably above the number of invocations a user can trigger
  /// while JavaScript is cold, which is what the queue exists to hold.
  internal static let maxPendingInvocations = 100
  private static let pendingKey = "invocations.pending"
  /// Where an undecodable queue is set aside, so a bug report can still recover the raw bytes.
  private static let corruptedPendingKey = "invocations.pending.corrupted"
  private let defaults: UserDefaults
  /// A saturated queue drops one invocation on every append, so the log would repeat the same
  /// message on every dispatch; once per launch is enough to point at the fix.
  private var didLogDroppedInvocations = false

  init(defaults: UserDefaults = .standard) {
    self.defaults = defaults
  }

  private func storageKey(_ key: String) -> String {
    return "dev.expo.appintents.\(key)"
  }

  /// Returns the persisted queue, throwing when the stored blob cannot be decoded.
  func pending() throws -> [AppIntentInvocation] {
    guard let data = defaults.data(forKey: storageKey(Self.pendingKey)) else {
      return []
    }

    do {
      return try JSONDecoder().decode([AppIntentInvocation].self, from: data)
    } catch {
      // Set the bytes aside before anything can overwrite them.
      defaults.set(data, forKey: storageKey(Self.corruptedPendingKey))
      defaults.removeObject(forKey: storageKey(Self.pendingKey))

      let message =
        "expo-app-intents could not read the pending App Intent invocation queue, so any invocation "
        + "that was waiting for JavaScript is not delivered. The stored data is not valid JSON for "
        + "this version of the module, which usually means it was written by a different one. The "
        + "queue starts empty from now on; the unreadable data is kept under "
        + "'\(storageKey(Self.corruptedPendingKey))' in UserDefaults. Trigger the intent again, and "
        + "please report this at https://github.com/expo/expo/issues with that data. Decoding "
        + "error: \(error.localizedDescription)"
      log.error(message)
      throw AppIntentQueueException(message)
    }
  }

  /// Appends an invocation, keeping it even when the stored queue was unreadable.
  ///
  /// `dispatch` runs while JavaScript may still be cold, so there is nowhere to report a failure.
  /// `pending()` has already set a corrupt queue aside and logged it by this point, so starting a
  /// fresh queue is safe here.
  func append(_ invocation: AppIntentInvocation) {
    var invocations = (try? pending()) ?? []
    invocations.append(invocation)

    if invocations.count > Self.maxPendingInvocations {
      let droppedCount = invocations.count - Self.maxPendingInvocations
      invocations.removeFirst(droppedCount)
      if !didLogDroppedInvocations {
        didLogDroppedInvocations = true
        log.error(
          "expo-app-intents dropped \(droppedCount) pending App Intent invocation(s) to keep the "
            + "queue at its limit of \(Self.maxPendingInvocations), and keeps dropping the oldest "
            + "one on every dispatch until the queue is drained (this is only logged once). Mount "
            + "useAppIntents() once near the root of your app, and remove each invocation once you "
            + "have handled it. The newest \(Self.maxPendingInvocations) invocations are kept."
        )
      }
    }

    do {
      try persist(invocations)
    } catch {
      log.error(
        "expo-app-intents could not save the pending App Intent invocation queue, so the invocation "
          + "that just arrived is lost and never reaches JavaScript. Encoding error: \(error.localizedDescription)"
      )
    }
  }

  func remove(id: String) throws {
    try persist(try pending().filter { $0.id != id })
  }

  /// Drops the whole queue, including a blob that was set aside as corrupt.
  func clear() {
    defaults.removeObject(forKey: storageKey(Self.pendingKey))
    defaults.removeObject(forKey: storageKey(Self.corruptedPendingKey))
  }

  /// Writes the queue, leaving the stored queue untouched when it cannot be encoded.
  /// `AppIntentInvocation` makes its params JSON-representable, so this should never fail; if it
  /// ever does, keeping the previous queue is better than replacing it with nothing.
  private func persist(_ invocations: [AppIntentInvocation]) throws {
    let data = try JSONEncoder().encode(invocations)
    defaults.set(data, forKey: storageKey(Self.pendingKey))
  }
}
