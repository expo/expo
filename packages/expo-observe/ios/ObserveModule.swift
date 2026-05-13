// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import ExpoAppMetrics

internal let observeLogger = Logger(logHandlers: [createOSLogHandler(category: Logger.EXPO_LOG_CATEGORY)])

internal struct Config: Record {
  @Field var environment: String?
  @Field var dispatchingEnabled: Bool?
  @Field var dispatchInDebug: Bool?
  @Field var sampleRate: Double?
}

internal struct BundleDefaults: Record {
  @Field var environment: String = ""
  @Field var isJsDev: Bool = false
}

public final class ObserveModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoObserve")

    OnCreate {
      // The observability manager needs to know the project id. Currently it's available only through `expo-constants`,
      // which is not great as it requires the app context. Ideally if we move EAS-specific config to `expo-eas-client` at some point.
      if let manifest = getManifest(appContext), let projectId = getProjectId(manifest: manifest) {
        let baseUrl = getBaseUrl(manifest)
        let useOpenTelemetry = getUseOpenTelemetry(manifest)
        ObservabilityManager.setUseOpenTelemetry(useOpenTelemetry)
        // Set the endpoint URL after enabling Open Telemetry
        ObservabilityManager.setEndpointUrl(baseUrl, projectId: projectId)
      }
    }

    AsyncFunction("dispatchEvents") {
      await ObservabilityManager.dispatch()
    }

    Function("configure") { (config: Config) in
      AppMetricsActor.isolated {
        // Each call to `configure(...)` is a full replacement: absent fields reset prior values.
        ObserveUserDefaults.setConfig(
          PersistedConfig(
            dispatchingEnabled: config.dispatchingEnabled,
            dispatchInDebug: config.dispatchInDebug,
            sampleRate: config.sampleRate
          )
        )
        let resolvedEnvironment = config.environment ?? ObserveUserDefaults.bundleDefaults?.environment
        if let resolvedEnvironment {
          AppMetrics.setEnvironment(resolvedEnvironment)
        }
      }
    }

    Function("setBundleDefaults") { (defaults: BundleDefaults) in
      guard !defaults.environment.isEmpty else {
        observeLogger.warn(
          "[EAS Observe] setBundleDefaults received empty environment; skipping. " +
          "This is a bug in the JS layer — `process.env.NODE_ENV` should always resolve."
        )
        return
      }
      AppMetricsActor.isolated {
        ObserveUserDefaults.setBundleDefaults(
          PersistedBundleDefaults(environment: defaults.environment, isJsDev: defaults.isJsDev)
        )
        AppMetrics.setEnvironment(defaults.environment)
      }
    }
  }
}

private func getManifest(_ appContext: AppContext?) -> [String: Any]? {
  guard let manifest = appContext?.constants?.constants()["manifest"] as? [String: Any] else {
    observeLogger.warn("[EAS Observe] Unable to read the manifest")
    return nil
  }
  return manifest
}

private func getProjectId(manifest: [String: Any]) -> String? {
  let value = getManifestProperty("extra.eas.projectId", manifest)
  guard let projectId = value as? String else {
    observeLogger.warn("[EAS Observe] Unable to get the project ID")
    return nil
  }
  return projectId
}

private func getBaseUrl(_ manifest: [String: Any]) -> String? {
  return getManifestProperty("extra.eas.observe.endpointUrl", manifest) as? String
}

private func getUseOpenTelemetry(_ manifest: [String: Any]) -> Bool? {
  return getManifestProperty("extra.eas.observe.useOpenTelemetry", manifest) as? Bool
}

/**
 * Traverses the manifest using a dot-separated property chain.
 * For example, "extra.eas.projectId" will navigate manifest["extra"]["eas"]["projectId"].
 */
private func getManifestProperty(_ propertyChain: String, _ manifest: [String: Any]) -> Any? {
  let keys = propertyChain.split(separator: ".").map { String($0) }
  var value: Any? = manifest
  for key in keys {
    guard let nestedValue = value as? [String: Any], let nextValue = nestedValue[key] else {
      return nil
    }
    value = nextValue
  }
  return value
}
