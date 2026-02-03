// Copyright 2025-present 650 Industries. All rights reserved.

public protocol AnyWorkletViewFunction: AnyDefinition, AnyViewDefinitionElement, Sendable {
  var name: String { get }
  func call(view: Any, arguments: [Any], appContext: AppContext) throws -> Any?
}

public final class WorkletViewFunctionDefinition: AnyWorkletViewFunction, @unchecked Sendable {
  public let name: String
  private let body: (Any, [Any]) throws -> Any?

  init(name: String, body: @escaping (Any, [Any]) throws -> Any?) {
    self.name = name
    self.body = body
  }

  public func call(view: Any, arguments: [Any], appContext: AppContext) throws -> Any? {
    return try body(view, arguments)
  }
}
