import ExpoAppMetrics
import ExpoModulesCore
import Foundation

/**
 An object representing an event providing some app metrics and the information about the app and the device.
 In this form metrics and metadata are sent to the EAS endpoint.
 */
struct Event: Codable, Sendable {
  let metadata: Metadata
  let metrics: [Metric]
  let logs: [Log]

  struct Metadata: Codable, Sendable {
    // AppInfo
    let appName: String?
    let appIdentifier: String?
    let appVersion: String?
    let appBuildNumber: String?
    let appEasBuildId: String?
    let appUpdatesInfo: AppInfo.UpdatesInfo?

    // DeviceInfo
    let deviceName: String
    let deviceModel: String
    let deviceOs: String
    let deviceOsVersion: String

    // Versions
    let reactNativeVersion: String
    let expoSdkVersion: String
    let clientVersion: String

    // Other metadata
    let languageTag: String
    let environment: String?
  }

  struct Metric: Codable, Sendable {
    // Metric
    let category: String?
    let name: String
    let value: Double
    let timestamp: String?

    // Session
    let sessionId: String
    let parentSessionId: String?

    // Metadata
    let routeName: String?
    let updateId: String?
    let customParams: AnyCodable?
  }

  struct Log: Codable, Sendable {
    let name: String
    let body: String?
    let timestamp: String
    let severity: Severity
    let attributes: AnyCodable?
    let droppedAttributesCount: Int

    // Session
    let sessionId: String
  }

  /**
   Builds an `Event` from a session row plus its metric/log batch. The session row carries all the
   metadata that used to live on `Entry`/`AppInfo`/`DeviceInfo`; metrics and logs are passed
   separately so a partial dispatch (only the rows past a cursor) can still produce a valid event.
   */
  static func from(session: SessionRow, metrics: [MetricRow], logs: [LogRow]) -> Event {
    let updatesInfo = AppInfo.UpdatesInfo(
      updateId: session.appUpdateId,
      runtimeVersion: session.appUpdateRuntimeVersion,
      requestHeaders: decodeRequestHeaders(session.appUpdateRequestHeaders)
    )
    return Event(
      metadata: Metadata(
        appName: session.appName,
        appIdentifier: session.appIdentifier,
        appVersion: session.appVersion,
        appBuildNumber: session.appBuildNumber,
        appEasBuildId: session.appEasBuildId,
        appUpdatesInfo: updatesInfo.isEmpty ? nil : updatesInfo,
        deviceName: session.deviceName ?? "",
        deviceModel: session.deviceModel ?? "",
        deviceOs: session.deviceOs ?? "",
        deviceOsVersion: session.deviceOsVersion ?? "",
        reactNativeVersion: session.reactNativeVersion ?? "",
        expoSdkVersion: session.expoSdkVersion ?? "",
        clientVersion: ObserveVersions.clientVersion,
        languageTag: session.languageTag ?? Locale.preferredLanguages.first ?? "en-US",
        environment: session.environment
      ),
      metrics: metrics.map { metric in
        return Metric(
          category: metric.category,
          name: metric.name,
          value: metric.value,
          timestamp: metric.timestamp,
          sessionId: metric.sessionId,
          parentSessionId: nil,
          routeName: metric.routeName,
          updateId: metric.updateId,
          customParams: decodeCustomParams(metric.params)
        )
      },
      logs: logs.map { log in
        return Log(
          name: log.name,
          body: log.body,
          timestamp: log.timestamp,
          severity: Severity(rawValue: log.severity) ?? .info,
          attributes: decodeCustomParams(log.attributes),
          droppedAttributesCount: log.droppedAttributesCount,
          sessionId: log.sessionId
        )
      }
    )
  }
}

private func decodeRequestHeaders(_ json: String?) -> [String: String]? {
  guard let json, let data = json.data(using: .utf8) else {
    return nil
  }
  return try? JSONSerialization.jsonObject(with: data) as? [String: String]
}

private func decodeCustomParams(_ json: String?) -> AnyCodable? {
  guard let json, let data = json.data(using: .utf8) else {
    return nil
  }
  return try? JSONDecoder().decode(AnyCodable.self, from: data)
}
