// Copyright 2025-present 650 Industries. All rights reserved.

@globalActor
public actor AppMetricsActor: GlobalActor {
  static public let shared = AppMetricsActor()

  private init() {}

  /// Executes the given closure isolated to `AppMetricsActor` from an asynchronous context.
  @discardableResult
  public static func isolated<T: Sendable>(_ action: @AppMetricsActor @escaping () async throws -> T) async throws -> T
  {
    return try await isolated(action).value
  }

  /// Executes the given closure isolated to `AppMetricsActor` from a synchronous context.
  @discardableResult
  public static func isolated<Success: Sendable>(_ action: @AppMetricsActor @escaping () async throws -> Success)
    -> Task<Success, Error>
  {
    // `Task` enqueues an isolated operation directly on its actor, so tasks created one after
    // another start in that order.
    return Task(name: "ExpoAppMetrics", operation: action)
  }
}
