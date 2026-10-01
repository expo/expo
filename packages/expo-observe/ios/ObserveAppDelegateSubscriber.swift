// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoAppMetrics
import ExpoModulesCore

public class ObserveAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func appDelegateWillBeginInitialization() {
    MetricsSinkRegistry.register(DatabaseMetricsSink.shared)
  }

  public func applicationWillResignActive(_ application: UIApplication) {
    AppMetricsActor.isolated {
      await ObservabilityManager.dispatch()
    }
  }

  public func applicationWillTerminate(_ application: UIApplication) {
    AppMetricsActor.isolated {
      await ObservabilityManager.dispatch()
    }
  }
}
