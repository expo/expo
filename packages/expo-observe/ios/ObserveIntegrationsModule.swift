// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation

/// Runs the JavaScript integrations that libraries register with `registerObserveIntegration` from
/// expo-observe-interface, which finds this module in `expo.packages['expo-observe']`. The registrations belong to
/// one JavaScript runtime, so they start only after `configure` runs in that runtime, and a reload drops them.
@ExpoModule("ObserveIntegrations", classes: [ObserveIntegrationClient.self])
public final class ObserveIntegrationsModule: Module, @unchecked Sendable {
  /// The version of the contract with `registerObserveIntegration`. Increase it for a change that an older
  /// expo-observe-interface cannot handle.
  static let apiVersion = 1

  /// The integrations that expo-observe runs in JavaScript without a registration.
  static let builtInJavaScriptIntegrations: Set<String> = [
    "expo-image",
    "expo-router",
    "react-native-reanimated",
    "react-navigation",
  ]

  /// A library can register its integration after `configure`, for example when a screen that imports it loads, so
  /// the warning about a missing integration waits this long.
  static let missingIntegrationWarningDelay: TimeInterval = 5

  private final class Registration {
    let apply: (String?, ObserveIntegrationClient?) -> Void
    /// The config JSON of the current setup, or `nil` when the integration is not set up.
    var configJson: String?
    var client: IntegrationClient?

    init(apply: @escaping (String?, ObserveIntegrationClient?) -> Void) {
      self.apply = apply
    }
  }

  /// The host of the native integrations, which also makes the clients. Tests replace it.
  var host = IntegrationHost.shared

  // Guards the state, so the class can be `@unchecked Sendable` for the warning that runs on the main queue. It is
  // recursive, because a setup in JavaScript can register another integration.
  private let lock = NSRecursiveLock()
  /// The config JSON of each enabled integration, by name. `nil` until `configure` runs in this runtime.
  private var configs: [String: String]?
  private var registrations: [String: Registration] = [:]
  private var warnedIntegrations: Set<String> = []

  @JS(.cached)
  var apiVersion: Int {
    return Self.apiVersion
  }

  /// Registers a JavaScript integration. `apply` gets the config JSON and a client to set up the integration, and
  /// `nil` for both to tear it down. A later registration with the same name replaces the earlier one.
  @JS
  func register(name: String, apply: @escaping (String?, ObserveIntegrationClient?) -> Void) {
    lock.withLock {
      if let previous = registrations[name] {
        stop(previous)
      }
      registrations[name] = Registration(apply: apply)
      update(name)
    }
  }

  /// Applies the config JSON of each enabled integration, by name. `ObserveModule` calls it on each `configure`.
  func apply(_ configs: [String: String]) {
    lock.withLock {
      self.configs = configs
      updateAll()
    }
    DispatchQueue.main.asyncAfter(deadline: .now() + Self.missingIntegrationWarningDelay) { [weak self] in
      self?.warnAboutMissingIntegrations(Set(configs.keys))
    }
  }

  /// Applies the config again after `Observe.setConsent`. It runs on the JavaScript thread, so the setups and the
  /// teardowns stay in order with the ones from `configure` and `register`.
  func consentDidChange() {
    try? appContext?.runtime.schedule { [weak self] in
      guard let self else {
        return
      }
      lock.withLock {
        updateAll()
      }
    }
  }

  public override func willDestroy() {
    // The runtime is going away, so the teardowns in JavaScript cannot run.
    lock.withLock {
      for registration in registrations.values {
        registration.client?.invalidate()
      }
      registrations.removeAll()
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
    let configJson = host.isConsentGranted ? configs[name] : nil
    guard registration.configJson != configJson else {
      return
    }
    stop(registration)
    if let configJson {
      let client = host.makeClient(integration: name, config: IntegrationHost.parseConfig(configJson))
      registration.configJson = configJson
      registration.client = client
      registration.apply(configJson, ObserveIntegrationClient(client: client))
    }
  }

  private func stop(_ registration: Registration) {
    guard registration.configJson != nil else {
      return
    }
    let client = registration.client
    registration.configJson = nil
    registration.client = nil
    registration.apply(nil, nil)
    client?.invalidate()
  }

  private func warnAboutMissingIntegrations(_ names: Set<String>) {
    let missingNames = lock.withLock {
      let missingNames = names.subtracting(Self.builtInJavaScriptIntegrations).subtracting(warnedIntegrations)
        .filter { registrations[$0] == nil && !host.isRegistered($0) }
      warnedIntegrations.formUnion(missingNames)
      return missingNames
    }
    for name in missingNames.sorted() {
      appContext?.jsLogger.warn(
        "[expo-observe] `integrations: { '\(name)': ... }` was set, but no integration named '\(name)' was "
          + "registered. Install the `\(name)` package and import it in your app, or remove the key from "
          + "`Observe.configure`."
      )
    }
  }
}
