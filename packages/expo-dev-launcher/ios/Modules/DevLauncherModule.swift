// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class DevLauncherModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoDevLauncher")

    AsyncFunction("loadApp") { (urlString: String, projectUrlString: String?, promise: Promise) in
      guard let url = URL(string: urlString) else {
        promise.reject(DevLauncherInvalidURLException())
        return
      }

      if let projectUrlString, URL(string: projectUrlString) == nil {
        promise.reject(DevLauncherInvalidProjectURLException())
        return
      }

      let projectUrl = projectUrlString.flatMap { URL(string: $0) }

      EXDevLauncherController.sharedInstance().loadApp(
        url,
        withProjectUrl: projectUrl,
        onSuccess: {
          promise.resolve(true)
        },
        onError: { error in
          promise.reject(DevLauncherLoadAppException(error.localizedDescription).causedBy(error))
        }
      )
    }
  }
}
