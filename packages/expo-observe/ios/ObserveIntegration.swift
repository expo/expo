// Copyright 2026-present 650 Industries. All rights reserved.

/// An integration that reports what a library logs to EAS Observe. `IntegrationHost` sets it up when
/// `Observe.configure` enables it, and tears it down when a later `configure` changes its config or turns it off.
internal protocol ObserveIntegration: AnyObject, Sendable {
  /// The key of the integration in `Observe.configure({ integrations })`.
  var name: String { get }

  /// Starts the integration. `config` is the object under the integration key, or an empty object for `true`.
  /// `observe` reports for this integration only, and stops working after the returned teardown runs.
  /// Returns a function that stops the integration, or `nil` when there is nothing to stop.
  ///
  /// The setup and the teardown run on the thread that applies the config, at launch or in `configure`, so they must
  /// not block.
  func setup(config: [String: Any], observe: any ObserveClient) throws -> (() -> Void)?
}

/// Reports for one integration. All functions can be called from any thread. They do nothing after the
/// integration is torn down. Each one returns whether the report was recorded.
internal protocol ObserveClient: AnyObject, Sendable {
  /// Records an error. The `ignoredCodes` option of the integration config can drop it.
  @discardableResult
  func reportError(_ report: ObserveErrorReport) -> Bool

  /// Records a warning as a log event. The `ignoredCodes` option of the integration config can drop it.
  @discardableResult
  func reportWarning(_ report: ObserveWarningReport) -> Bool
}

internal struct ObserveErrorReport: Sendable {
  /// The error type, for example `updates.error`. Observe groups errors by type and message.
  var type: String
  var message: String
  var stacktrace: String?
  /// A stable code of the error, recorded as the `expo.error.code` attribute.
  var code: String?
  /// Whether the error is written to disk before `reportError` returns, and recorded on the next launch. Use it for
  /// an error that is reported just before the process can end.
  var persistImmediately: Bool = false
}

internal struct ObserveWarningReport: Sendable {
  /// The event name, for example `updates.warning`.
  var name: String
  /// The name that the dashboard shows for the event.
  var displayName: String?
  var message: String
  /// A stable code of the warning, recorded as the `code` attribute.
  var code: String?
  var attributes: [String: ObserveAttributeValue] = [:]
}

internal enum ObserveAttributeValue: Sendable, Equatable {
  case string(String)
  case number(Double)
  case bool(Bool)
}
