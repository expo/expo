// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import ExpoAppMetrics

public class ObserveAppDelegateSubscriber: ExpoAppDelegateSubscriber {
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
