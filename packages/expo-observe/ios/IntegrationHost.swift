// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation

/// Sets up the integrations that `Observe.configure` enables, and tears them down when a later `configure` changes
/// their config or turns them off. One host serves the whole process. At launch, it applies the config that the last
/// `configure` stored, before the app code runs, so the integrations see what the libraries log from the start.
/// While the user has not granted consent to Observe, no integration runs.
internal final class IntegrationHost: @unchecked Sendable {
  static let shared: IntegrationHost = {
    let host = IntegrationHost(recorder: AppMetricsIntegrationRecorder())
    host.register(ExpoUpdatesIntegration())
    return host
  }()

  private final class Registration {
    let integration: any ObserveIntegration
    /// The config JSON of the current setup, or `nil` when the integration is not set up.
    var configJson: String?
    var client: IntegrationClient?
    var teardown: (() -> Void)?

    init(integration: any ObserveIntegration) {
      self.integration = integration
    }
  }

  // Recursive, because a setup or a teardown can call the host.
  private let lock = NSRecursiveLock()
  private let recorder: any IntegrationRecorder
  /// The config JSON of each enabled integration, by name. `nil` until the first `apply`.
  private var configs: [String: String]?
  private var registrations: [String: Registration] = [:]

  init(recorder: any IntegrationRecorder) {
    self.recorder = recorder
  }

  /// Registers an integration, and sets it up when the current config enables it.
  func register(_ integration: any ObserveIntegration) {
    lock.withLock {
      let name = integration.name
      guard registrations[name] == nil else {
        logger.warn(
          "[expo-observe] An integration named '\(name)' is already registered, so the new registration is ignored."
        )
        return
      }
      registrations[name] = Registration(integration: integration)
      update(name)
    }
  }

  /// Applies the config JSON of each enabled integration, by name. An integration that is not in `configs` is torn
  /// down. An integration whose config JSON changed is torn down and set up again with a new client.
  func apply(_ configs: [String: String]) {
    lock.withLock {
      self.configs = configs
      updateAll()
    }
  }

  /// Applies the config again after `Observe.setConsent`. A revoke tears down every integration, and a grant sets up
  /// the integrations that the config enables.
  func consentDidChange() {
    lock.withLock {
      updateAll()
    }
  }

  private func updateAll() {
    for name in registrations.keys.sorted() {
      update(name)
    }
  }

  private func update(_ name: String) {
    guard let registration = registrations[name], let configs else {
      return
    }
    let configJson = recorder.isConsentGranted ? configs[name] : nil
    guard registration.configJson != configJson else {
      return
    }
    stop(registration)
    if let configJson {
      start(registration, configJson: configJson)
    }
  }

  private func start(_ registration: Registration, configJson: String) {
    let name = registration.integration.name
    let config = Self.parseConfig(configJson)
    let client = IntegrationClient(integration: name, config: config, recorder: recorder)
    // Set before the setup, so a setup that throws is not retried until the config changes.
    registration.configJson = configJson
    do {
      registration.teardown = try registration.integration.setup(config: config, observe: client)
      registration.client = client
    } catch {
      client.invalidate()
      logger.warn(
        "[expo-observe] The '\(name)' integration failed to start, so it reports nothing until its config changes: "
          + "\(error.localizedDescription)"
      )
    }
  }

  private func stop(_ registration: Registration) {
    let teardown = registration.teardown
    let client = registration.client
    registration.configJson = nil
    registration.teardown = nil
    registration.client = nil
    teardown?()
    client?.invalidate()
  }

  private static func parseConfig(_ json: String) -> [String: Any] {
    let object = try? JSONSerialization.jsonObject(with: Data(json.utf8))
    return object as? [String: Any] ?? [:]
  }

  // MARK: - Config conversion

  /// Converts the `integrations` object of `Observe.configure` to the config JSON of each enabled integration, by
  /// name. `true` enables an integration with an empty config, and an object enables it with that object. Any other
  /// value, such as `false`, turns it off. The JSON has sorted keys, so equal configs have equal JSON. Values that
  /// JSON cannot represent, such as functions, are left out.
  static func configs(from integrations: [String: Any]?) -> [String: String] {
    var configs: [String: String] = [:]
    for (name, value) in integrations ?? [:] {
      if let object = value as? [String: Any] {
        configs[name] = jsonString(object)
      } else if let isEnabled = value as? Bool, isEnabled {
        configs[name] = "{}"
      }
    }
    return configs
  }

  private static func jsonString(_ object: [String: Any]) -> String {
    let representable = object.compactMapValues(jsonRepresentable)
    // `JSONSerialization` raises an Objective-C exception for a value it cannot represent, so it is checked first.
    guard JSONSerialization.isValidJSONObject(representable),
      let data = try? JSONSerialization.data(withJSONObject: representable, options: [.sortedKeys])
    else {
      return "{}"
    }
    return String(decoding: data, as: UTF8.self)
  }

  /// Returns the value without the parts that JSON cannot represent, or `nil` when JSON cannot represent the value.
  private static func jsonRepresentable(_ value: Any) -> Any? {
    switch value {
    case let string as String:
      return string
    case let number as NSNumber:
      return number.doubleValue.isFinite ? number : nil
    case let object as [String: Any]:
      return object.compactMapValues(jsonRepresentable)
    case let array as [Any]:
      return array.compactMap(jsonRepresentable)
    case is NSNull:
      return NSNull()
    default:
      return nil
    }
  }
}
