// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class DevLauncherModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoDevLauncher")

    AsyncFunction("loadApp") { (url: URL, projectUrl: URL?, promise: Promise) in
      if url.scheme == nil {
        throw DevLauncherInvalidURLException()
      }

      if let projectUrl, projectUrl.scheme == nil {
        throw DevLauncherInvalidURLException()
      }

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
