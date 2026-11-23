// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import ExpoObserveInterface

/// The client that a JavaScript integration gets in `setup`. `registerObserveIntegration` in expo-observe-interface
/// wraps it in an `ObserveClient` object.
@SharedObject
public final class ObserveIntegrationClient: SharedObject {
  let client: IntegrationClient

  init(client: IntegrationClient) {
    self.client = client
    super.init()
  }

  @JS
  func reportError(_ report: JSObserveErrorReport) -> Bool {
    return client.reportError(
      ObserveErrorReport(
        type: report.type,
        message: report.message,
        stacktrace: report.stacktrace,
        code: report.code,
        persistImmediately: report.persistImmediately
      )
    )
  }

  @JS
  func reportWarning(_ report: JSObserveWarningReport) -> Bool {
    return client.reportWarning(
      ObserveWarningReport(
        name: report.name,
        displayName: report.displayName,
        message: report.message,
        code: report.code,
        attributes: report.attributes?.mapValues { $0.attributeValue } ?? [:]
      )
    )
  }

  @JS
  func logEvent(_ event: JSObserveEvent) -> Bool {
    return client.logEvent(
      ObserveEvent(
        name: event.name,
        displayName: event.displayName,
        body: event.body,
        attributes: event.attributes?.mapValues { $0.attributeValue } ?? [:],
        severity: event.severity.flatMap(ObserveSeverity.init(rawValue:)) ?? .info
      )
    )
  }
}

@Record
struct JSObserveErrorReport {
  var type: String = ""
  var message: String = ""
  var stacktrace: String?
  var code: String?
  var persistImmediately: Bool = false
}

@Record
struct JSObserveWarningReport {
  var name: String = ""
  var displayName: String?
  var message: String = ""
  var code: String?
  var attributes: [String: JSObserveAttributeValue]?
}

@Record
struct JSObserveEvent {
  var name: String = ""
  var displayName: String?
  var body: String?
  var attributes: [String: JSObserveAttributeValue]?
  var severity: String?
}

@Union
enum JSObserveAttributeValue {
  case string(String)
  case number(Double)
  case bool(Bool)

  var attributeValue: ObserveAttributeValue {
    switch self {
    case .string(let value):
      return .string(value)
    case .number(let value):
      return .number(value)
    case .bool(let value):
      return .bool(value)
    }
  }
}
