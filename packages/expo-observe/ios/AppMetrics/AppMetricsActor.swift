// Copyright 2025-present 650 Industries. All rights reserved.

@globalActor
actor AppMetricsActor: GlobalActor {
  static let shared = AppMetricsActor()

  private init() {}

  /// Executes the given closure isolated to `AppMetricsActor` from an asynchronous context.
  @discardableResult
  static func isolated<T: Sendable>(_ action: @AppMetricsActor @escaping () async throws -> T) async throws -> T {
    return try await isolated(action).value
  }

  /// Executes the given closure isolated to `AppMetricsActor` from a synchronous context.
  @discardableResult
  static func isolated<Success: Sendable>(_ action: @AppMetricsActor @escaping () async throws -> Success)
    -> Task<Success, Error>
  {
    return Task(name: "ExpoAppMetrics") {
      return try await action()
    }
  }
}
