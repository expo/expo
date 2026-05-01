import ExpoAppMetrics

/**
 An object representing an event providing some app metrics and the information about the app and the device.
 In this form metrics and metadata are sent to the EAS endpoint.
 */
struct Event: Codable, Sendable {
  let metadata: Metadata
  let metrics: [Metric]

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

  /**
   Creates a new event for EAS, based on the objects from `expo-app-metrics` package.
   */
  static func create(app: AppInfo, device: DeviceInfo, sessions: [Session], environment: String? = nil) -> Event {
    return Event(
      metadata: Metadata(
        appName: app.appName,
        appIdentifier: app.appId,
        appVersion: app.appVersion,
        appBuildNumber: app.buildNumber,
        appEasBuildId: app.easBuildId,
        appUpdatesInfo: app.updatesInfo,

        deviceName: device.modelName,
        deviceModel: device.modelIdentifier,
        deviceOs: device.systemName,
        deviceOsVersion: device.systemVersion,

        reactNativeVersion: app.reactNativeVersion,
        expoSdkVersion: app.expoSdkVersion,
        clientVersion: ObserveVersions.clientVersion,

        languageTag: Locale.preferredLanguages.first ?? "en-US",
        environment: environment
      ),
      metrics: sessions.flatMap { session in
        return session.metrics.map { metric in
          return Metric(
            category: metric.category?.rawValue,
            name: metric.name,
            value: metric.value,
            timestamp: metric.timestamp,
            sessionId: session.id,
            parentSessionId: nil,
            routeName: metric.routeName,
            updateId: metric.updateId,
            customParams: metric.params
          )
        }
      }
    )
  }
}
