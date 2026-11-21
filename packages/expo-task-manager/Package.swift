// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-task-manager`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-task-manager",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoTaskManager", targets: ["ExpoTaskManager", "ExpoTaskManagerObjC"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoTaskManager",
      dependencies: [
        "ExpoTaskManagerObjC",
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders"),
      ],
      path: "ios/ExpoTaskManager",
      sources: [
        "OnDemandTaskConsumer.swift",
        "OnDemandTaskException.swift",
        "TaskManagerAppDelegateSubscriber.swift",
        "TaskManagerModule.swift",
        "TaskRunner.swift",
      ],
      resources: [.copy("PrivacyInfo.xcprivacy")]
    ),
    .target(
      name: "ExpoTaskManagerObjC",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios/ExpoTaskManagerObjC",
      publicHeadersPath: "include"
    ),
  ],
  swiftLanguageModes: [.v5]
)
