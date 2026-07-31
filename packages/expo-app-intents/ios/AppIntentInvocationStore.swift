import Foundation
import ExpoModulesCore

/**
 Thrown when the persisted invocation queue cannot be read or written.

 The store's callers reach JavaScript through `ExpoAppIntentsModule`, so throwing puts the failure
 in a rejected promise. That matters because the global `log` only writes to OSLog: a message sent
 there never appears in Metro or LogBox, so a developer would never find out on their own.
 */
internal final class AppIntentQueueException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    return param
  }
}

/**
 UserDefaults-backed persistence for intent invocations. Not actor-isolated on its own:
 `AppIntentDispatcher` serializes access. Keys go through `storageKey` so a future
 App Intents extension target can switch to an App Group suite in one place.
 */
internal final class AppIntentInvocationStore {
  /**
   How many invocations the queue holds at most, so that an app which never dequeues cannot grow it
   without bound. See `append`. Comfortably above the number of invocations a user can trigger
   while JavaScript is cold, which is what the queue exists to hold.
   */
  internal static let maxPendingInvocations = 100
  private static let pendingKey = "invocations.pending"
  /// Where an undecodable queue is set aside, so a bug report can still recover the raw bytes.
  private static let corruptedPendingKey = "invocations.pending.corrupted"
  private let defaults: UserDefaults

  init(defaults: UserDefaults = .standard) {
    self.defaults = defaults
  }

  private func storageKey(_ key: String) -> String {
    return "dev.expo.appintents.\(key)"
  }

  /**
   Returns the persisted queue, throwing when the stored blob cannot be decoded.

   Returning an empty queue instead would destroy the invocations: the next `append` or `remove`
   writes the queue back, so the unreadable blob would be replaced by that empty queue and no one
   would ever learn it existed. The raw bytes are moved to `corruptedPendingKey` first, which both
   preserves them for a bug report and lets the queue start over instead of failing forever.
   */
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

  /**
   Appends an invocation, keeping it even when the stored queue was unreadable.

   `dispatch` runs while JavaScript may still be cold, so there is nowhere to report a failure to
   and dropping the invocation would be the worst outcome. `pending()` has already set a corrupt
   queue aside and logged it by this point, so starting a fresh queue is safe here.

   Only JavaScript takes invocations off the queue, so an app that never dequeues - one whose
   handler throws, or that never mounts `useAppIntents` - would grow it without bound.
   `UserDefaults` is read into memory when the app launches, so every later start would pay for
   that. Past `maxPendingInvocations` the oldest invocations are dropped rather than the newest: the
   newest is what the user just asked for, and one from weeks ago is not something they are still
   waiting on.
   */
  func append(_ invocation: AppIntentInvocation) {
    var invocations = (try? pending()) ?? []
    invocations.append(invocation)

    if invocations.count > Self.maxPendingInvocations {
      let droppedCount = invocations.count - Self.maxPendingInvocations
      invocations.removeFirst(droppedCount)
      log.error(
        "expo-app-intents dropped \(droppedCount) pending App Intent invocation(s) to keep the "
          + "queue at its limit of \(Self.maxPendingInvocations). Nothing has been taking "
          + "invocations off the queue, so they are piling up: either JavaScript never handles "
          + "them, or it does not call removePendingInvocationAsync(id) afterwards. Mount "
          + "useAppIntents() once near the root of your app, and remove each invocation once you "
          + "have applied it. The newest \(Self.maxPendingInvocations) invocations are kept."
      )
    }

    do {
      try persist(invocations)
    } catch {
      log.error(
        "expo-app-intents could not save the pending App Intent invocation queue, so the invocation "
          + "that just arrived is lost and never reaches JavaScript. What stays on disk is whatever "
          + "the last successful write left there, which is nothing at all when the previous queue "
          + "was unreadable and had to be set aside. This is a bug in expo-app-intents; please "
          + "report it at https://github.com/expo/expo/issues with the params your intent "
          + "dispatches. Encoding error: \(error.localizedDescription)"
      )
    }
  }

  func remove(id: String) throws {
    try persist(try pending().filter { $0.id != id })
  }

  /**
   Drops the whole queue, including a blob that was set aside as corrupt.

   `clearPendingInvocationsAsync` means "nothing is pending anymore", and keeping an unreadable
   blob around forever after that would only be reported again and never acted on.
   */
  func clear() {
    defaults.removeObject(forKey: storageKey(Self.pendingKey))
    defaults.removeObject(forKey: storageKey(Self.corruptedPendingKey))
  }

  /**
   Writes the queue, leaving the stored queue untouched when it cannot be encoded.
   `AppIntentInvocation` makes its params JSON-representable, so this should never fail; if it
   ever does, keeping the previous queue is better than replacing it with nothing.
   */
  private func persist(_ invocations: [AppIntentInvocation]) throws {
    let data = try JSONEncoder().encode(invocations)
    defaults.set(data, forKey: storageKey(Self.pendingKey))
  }
}
