// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class ObserveAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  // Runs before the app code, so the integrations that the stored config enables see what the libraries log from the
  // start of the launch. An app delegate that starts React Native before it calls `super` starts expo-updates before
  // `didFinishLaunchingWithOptions` reaches the subscribers.
  public func subscriberDidRegister() {
    IntegrationHost.shared.apply(ObserveUserDefaults.integrations ?? [:])
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
