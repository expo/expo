/// Stores and resolves ``VideoAssetTransportProvider`` instances used by `expo-video`.
///
/// The registry is the public entry point for transport modules to register custom source
/// handlers at startup. When `expo-video` creates a `VideoAsset`, it asks the registry for the
/// first provider, by priority, that returns a ``VideoAssetLoadPlan`` for the source being loaded.
///
/// Providers are uniquely identified by `identifier`. Registering a provider with an existing
/// identifier replaces the previous registration.
public final class VideoAssetTransportRegistry {
  /// The shared registry instance used by `expo-video`.
  public static let shared = VideoAssetTransportRegistry()

  /// Registers or replaces a transport provider in the shared registry.
  public static func registerProvider(_ provider: any VideoAssetTransportProvider) {
    shared.registerProvider(provider)
  }

  /// Removes a provider with the matching identifier from the shared registry.
  public static func unregisterProvider(withId identifier: String) {
    shared.unregisterProvider(withId: identifier)
  }

  private struct Entry {
    let registrationOrder: Int
    var provider: any VideoAssetTransportProvider
  }

  private let queue = DispatchQueue(label: "expo.video.transport.registry")
  private var entries: [Entry] = []
  private var nextRegistrationOrder = 0
  private var defaultProvidersRegistered = false

  private init() {}

  internal static func registerDefaultProviders() {
    shared.registerDefaultProviders()
  }

  internal static func resolveLoadPlan(for videoSource: VideoSource, url: URL) -> VideoAssetLoadPlan? {
    shared.resolveLoadPlan(for: videoSource, url: url)
  }

  /// Registers or replaces a transport provider.
  ///
  /// If another provider with the same identifier is already registered, it is replaced in place.
  /// Provider resolution prefers higher `priority` values. When priorities are equal, the earlier
  /// registration order wins.
  public func registerProvider(_ provider: any VideoAssetTransportProvider) {
    queue.sync {
      upsertProvider(provider)
    }
  }

  /// Unregisters a transport provider by identifier.
  public func unregisterProvider(withId identifier: String) {
    queue.sync {
      entries.removeAll { $0.provider.identifier == identifier }
    }
  }

  internal func registerDefaultProviders() {
    queue.sync {
      guard !defaultProvidersRegistered else {
        return
      }
      defaultProvidersRegistered = true
      upsertProvider(CacheVideoAssetTransportProvider())
    }
  }

  internal func resolveLoadPlan(for videoSource: VideoSource, url: URL) -> VideoAssetLoadPlan? {
    registerDefaultProviders()

    let sourceDescriptor = VideoAssetSourceDescriptor(videoSource: videoSource, url: url)
    return queue.sync {
      for entry in sortedEntries() {
        if let loadPlan = entry.provider.makeLoadPlan(for: sourceDescriptor) {
          return loadPlan
        }
      }
      return nil
    }
  }

  private func upsertProvider(_ provider: any VideoAssetTransportProvider) {
    if let index = entries.firstIndex(where: { $0.provider.identifier == provider.identifier }) {
      entries[index].provider = provider
      return
    }

    entries.append(Entry(registrationOrder: nextRegistrationOrder, provider: provider))
    nextRegistrationOrder += 1
  }

  private func sortedEntries() -> [Entry] {
    return entries.sorted { lhs, rhs in
      if lhs.provider.priority == rhs.provider.priority {
        return lhs.registrationOrder < rhs.registrationOrder
      }
      return lhs.provider.priority > rhs.provider.priority
    }
  }
}
