// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore
import EXManifests

final class ExpoGoModule: Module {
  let manifest: Manifest

  // swiftlint:disable:next unavailable_function
  required init(appContext: AppContext) {
    fatalError("Initializer not implemented, use init(appContext:params:manifest:) instead")
  }

  init(appContext: AppContext, manifest: Manifest) {
    self.manifest = manifest
    super.init(appContext: appContext)
  }

  func definition() -> ModuleDefinition {
    Name("ExpoGo")

    Constants {
      return [
        "expoVersion": Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion"),
        "projectConfig": manifest.expoGoConfigRootObject()
      ]
    }

    Function("getModulesSchema") {
      let jsonEncoder = JSONEncoder()
      guard let registry = appContext?.moduleRegistry else {
        return ""
      }
      if let jsonData = try? jsonEncoder.encode(ModuleRegistryEncoder(registry)),
        let jsonString = String(data: jsonData, encoding: .utf8) {
        return jsonString
      }
      return ""
    }
  }
}
