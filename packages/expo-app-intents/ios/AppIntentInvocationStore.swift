import Foundation

/**
 UserDefaults-backed persistence for intent invocations. Not actor-isolated on its own:
 `AppIntentDispatcher` serializes access. Keys go through `storageKey` so a future
 App Intents extension target can switch to an App Group suite in one place.
 */
internal final class AppIntentInvocationStore {
  private static let pendingKey = "invocations.pending"
  private let defaults: UserDefaults

  init(defaults: UserDefaults = .standard) {
    self.defaults = defaults
  }

  private func storageKey(_ key: String) -> String {
    return "dev.expo.appintents.\(key)"
  }

  func pending() -> [AppIntentInvocation] {
    if let data = defaults.data(forKey: storageKey(Self.pendingKey)),
      let invocations = try? JSONDecoder().decode([AppIntentInvocation].self, from: data) {
      return invocations
    }
    return []
  }

  func append(_ invocation: AppIntentInvocation) {
    var invocations = pending()
    invocations.append(invocation)
    persist(invocations)
  }

  func remove(id: String) {
    persist(pending().filter { $0.id != id })
  }

  func clear() {
    defaults.removeObject(forKey: storageKey(Self.pendingKey))
  }

  private func persist(_ invocations: [AppIntentInvocation]) {
    guard let data = try? JSONEncoder().encode(invocations) else {
      return
    }
    defaults.set(data, forKey: storageKey(Self.pendingKey))
  }
}
