import Foundation
import ExpoAppMetrics

// MARK: -- Open Telemetry data classes

struct OTStringValue: Codable, Sendable {
  let stringValue: String
}

struct OTAttribute: Codable, Sendable {
  let key: String
  let value: OTStringValue

  init(key: String, rawValue: String) {
    self.key = key
    self.value = OTStringValue(stringValue: rawValue)
  }
}

struct OTDataPoint: Codable, Sendable {
  let timeUnixNano: UInt64
  let asDouble: Double
  let attributes: [OTAttribute]
}

struct OTGauge: Codable, Sendable {
  let dataPoints: [OTDataPoint]
}

struct OTMetric: Codable, Sendable {
  let unit: String
  let name: String
  let gauge: OTGauge
}

struct OTMetadata: Codable, Sendable {
  let attributes: [OTAttribute]
}

struct OTScope: Codable, Sendable {
  let name: String
  let version: String
}

struct OTScopeMetrics: Codable, Sendable {
  let scope: OTScope
  let metrics: [OTMetric]
}

struct OTEvent: Codable, Sendable {
  let resource: OTMetadata
  let scopeMetrics: [OTScopeMetrics]
}

// MARK: -- Event extensions for Open Telemetry

// This must be kept in sync with the INTERNAL_TO_OTEL map in universe
// https://github.com/expo/universe/blob/main/server/www/src/middleware/easObserveRoutes.ts#L209
let metricNameMap = [
  "timeToInteractive": "expo.app_startup.tti",
  "timeToFirstRender": "expo.app_startup.ttr",
  "coldLaunchTime": "expo.app_startup.cold_launch_time",
  "warmLaunchTime": "expo.app_startup.warm_launch_time",
  "bundleLoadTime": "expo.app_startup.bundle_load_time",

  // Legacy metrics - will be removed in a future release
  "loadTime": "expo.app_startup.load_time",
  "launchTime": "expo.app_startup.launch_time",

  // Updates
  "updateDownloadTime": "expo.updates.download_time"
]

nonisolated(unsafe) let formatter = ISO8601DateFormatter()

extension Event.Metric {
  private func nsFromISODateString() -> UInt64 {
    if let dateString = self.timestamp,
       let date = formatter.date(from: dateString) {
      return UInt64(date.timeIntervalSince1970 * 1_000_000_000)
    }
    return UInt64(Date().timeIntervalSince1970 * 1_000_000_000)
  }

  func toOTMetric() -> OTMetric {
    var attributes: [OTAttribute] = [
      OTAttribute(key: "session.id", rawValue: sessionId)
    ]
    if let routeName {
      attributes.append(OTAttribute(key: "expo.route_name", rawValue: routeName))
    }
    if let updateId {
      attributes.append(OTAttribute(key: "expo.update_id", rawValue: updateId))
    }
    if let customParamsString = try? customParams?.toJSONString() {
      attributes.append(OTAttribute(key: "expo.custom_params", rawValue: customParamsString))
    }

    return OTMetric(
      unit: "s",
      name: metricNameMap[self.name] ?? "expo.app_startup.\(self.name)",
      gauge: OTGauge(dataPoints: [
        OTDataPoint(
          timeUnixNano: nsFromISODateString(),
          asDouble: self.value,
          attributes: attributes
        )
      ])
    )
  }
}

extension Event {
  func toOTMetadata(_ easClientId: String) -> OTMetadata {
    var attributes: [OTAttribute] = [
      OTAttribute(key: "os.type", rawValue: "darwin"),
      OTAttribute(key: "os.name", rawValue: metadata.deviceOs),
      OTAttribute(key: "os.version", rawValue: metadata.deviceOsVersion),
      OTAttribute(key: "device.model.name", rawValue: metadata.deviceName),
      OTAttribute(key: "device.model.identifier", rawValue: metadata.deviceModel),
      OTAttribute(key: "browser.language", rawValue: metadata.languageTag),
      OTAttribute(key: "telemetry.sdk.name", rawValue: "expo-observe"),
      OTAttribute(key: "telemetry.sdk.version", rawValue: ObserveVersions.clientVersion),
      OTAttribute(key: "telemetry.sdk.language", rawValue: "swift"),
      OTAttribute(key: "expo.sdk.version", rawValue: metadata.expoSdkVersion),
      OTAttribute(key: "expo.react_native.version", rawValue: metadata.reactNativeVersion),
      OTAttribute(key: "expo.eas_client.id", rawValue: easClientId),
    ]

    // Send optional attributes only if they are set.
    // Their defaults should be defined by the backend.
    if let appIdentifier = metadata.appIdentifier {
      attributes.append(OTAttribute(key: "service.name", rawValue: appIdentifier))
    }
    if let appVersion = metadata.appVersion {
      attributes.append(OTAttribute(key: "service.version", rawValue: appVersion))
    }
    if let appName = metadata.appName {
      attributes.append(OTAttribute(key: "expo.app.name", rawValue: appName))
    }
    if let appBuildNumber = metadata.appBuildNumber {
      attributes.append(OTAttribute(key: "expo.app.build_number", rawValue: appBuildNumber))
    }
    if let appUpdateId = metadata.appUpdateId {
      attributes.append(OTAttribute(key: "expo.app.update_id", rawValue: appUpdateId))
    }
    if let environment = metadata.environment {
      attributes.append(OTAttribute(key: "expo.environment", rawValue: environment))
    }
    if let appEasBuildId = metadata.appEasBuildId {
      attributes.append(OTAttribute(key: "expo.eas_build.id", rawValue: appEasBuildId))
    }
    return OTMetadata(attributes: attributes)
  }

  func toOTEvent(_ easClientId: String) -> OTEvent {
    OTEvent(
      resource: toOTMetadata(easClientId),
      scopeMetrics: [
        OTScopeMetrics(
          scope: OTScope(name: "expo-observe", version: ObserveVersions.clientVersion),
          metrics: self.metrics.map{ $0.toOTMetric() }
        )
      ]
    )
  }
}

// MARK: -- Request body for Open Telemetry events

internal struct OTRequestBody: Codable, Sendable {
  let resourceMetrics: [OTEvent]
}
