// Copyright 2019 650 Industries. All rights reserved.

import ExpoModulesCore

public final class E2ETestModule: Module {
  private let updatesService: EXUpdatesModuleInterface?
  private let methodQueue = DispatchQueue(label: "expo.modules.EXUpdatesQueue")

  public required init(appContext: AppContext) {
    updatesService = appContext.legacyModule(implementing: EXUpdatesModuleInterface.self)
    super.init(appContext: appContext)
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoUpdatesE2ETest")

    AsyncFunction("readInternalAssetsFolderAsync") { (promise: Promise) in
      guard let assetsFolder = AppController.sharedInstance.updatesDirectory else {
        promise.reject("ERR_UPDATES_E2E_READ", "No updatesDirectory initialized")
        return
      }

      FileDownloader.assetFilesQueue.async {
        var contents: [String]
        do {
          contents = try FileManager.default.contentsOfDirectory(atPath: assetsFolder.path)
        } catch {
          promise.reject("ERR_UPDATES_E2E_READ", error.localizedDescription)
          return
        }
        let count = contents.filter { file in
          return !(file.hasPrefix("expo-") && (file.hasSuffix(".db") || file.contains(".db-")))
        }.count
        promise.resolve(count)
      }
    }

    AsyncFunction("clearInternalAssetsFolderAsync") { (promise: Promise) in
      guard let assetsFolder = AppController.sharedInstance.updatesDirectory else {
        promise.reject("ERR_UPDATES_E2E_CLEAR", "No updatesDirectory initialized")
        return
      }

      FileDownloader.assetFilesQueue.async {
        var contents: [String]
        do {
          contents = try FileManager.default.contentsOfDirectory(atPath: assetsFolder.path)
        } catch {
          promise.reject("ERR_UPDATES_E2E_CLEAR", error.localizedDescription)
          return
        }
        let files = contents.filter { file in
          return !(file.hasPrefix("expo-") && (file.hasSuffix(".db") || file.contains(".db-")))
        }

        for file in files {
          let filePath = assetsFolder.appendingPathComponent(file).path
          do {
            try FileManager.default.removeItem(atPath: filePath)
          } catch {
            promise.reject("ERR_UPDATES_E2E_CLEAR", error.localizedDescription)
            return
          }
        }

        promise.resolve(nil)
      }
    }
  }
}
