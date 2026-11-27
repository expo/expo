// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing
import UIKit

@testable import ExpoModulesCore

/// Benchmarks for the members of the core module on the `expo` object. A JavaScript driver runs the
/// measured loop, so each operation covers the full call. Read every result against
/// `JS: empty driver loop`.
extension Benchmarks {
  @Test
  func `core: uuidv4`() async throws {
    try await coreModuleBenchmarkCase("core: uuidv4", body: "expo.uuidv4();")
  }

  @Test
  func `core: uuidv5`() async throws {
    try await coreModuleBenchmarkCase(
      "core: uuidv5",
      body: "expo.uuidv5('www.example.com', '6ba7b810-9dad-11d1-80b4-00c04fd430c8');"
    )
  }

  @Test
  func `core: getViewConfig of a DSL view`() async throws {
    try await coreModuleBenchmarkCase(
      "core: getViewConfig of a DSL view",
      body: "expo.getViewConfig('CoreBenchmarkDSLViews');"
    )
  }

  @Test
  func `core: getViewConfig of an @ExpoView view`() async throws {
    try await coreModuleBenchmarkCase(
      "core: getViewConfig of an @ExpoView view",
      body: "expo.getViewConfig('CoreBenchmarkViews');"
    )
  }

  @Test
  func `core: getViewConfig of an unknown module`() async throws {
    try await coreModuleBenchmarkCase(
      "core: getViewConfig of an unknown module",
      body: "expo.getViewConfig('Unknown');"
    )
  }

  @Test
  func `core: read expoModulesCoreVersion`() async throws {
    try await coreModuleBenchmarkCase("core: read expoModulesCoreVersion", body: "expo.expoModulesCoreVersion;")
  }

  @Test
  func `core: read cacheDir`() async throws {
    try await coreModuleBenchmarkCase("core: read cacheDir", body: "expo.cacheDir;")
  }

  @Test
  func `core: read isRunningOnQuest`() async throws {
    try await coreModuleBenchmarkCase("core: read isRunningOnQuest", body: "expo.isRunningOnQuest;")
  }
}

private func coreModuleBenchmarkCase(_ name: String, body: String) async throws {
  try await appContextBenchmarkCase { appContext in
    appContext.moduleRegistry.register(module: CoreBenchmarkDSLViewsModule(appContext: appContext), name: nil)
    appContext.moduleRegistry.register(module: CoreBenchmarkViewsModule(appContext: appContext), name: nil)
    let runtime = try appContext.runtime
    let run = try javaScriptDriver(runtime, body: body)
    try benchmark(name, runtime: runtime) { iterations in
      _ = try run.call(arguments: iterations)
    }
  }
}

private final class CoreBenchmarkDSLViewsModule: Module {
  func definition() -> ModuleDefinition {
    Name("CoreBenchmarkDSLViews")

    View(UIView.self) {
      Events("onTap")

      Prop("title") { (_: UIView, _: String) in }

      Prop("radius") { (_: UIView, _: Double) in }
    }
  }
}

@ViewProps
private struct CoreBenchmarkViewProps {
  var title = ""
  var radius = 0.0
  var onTap: () -> Void
}

@ExpoView<CoreBenchmarkViewProps>
private final class CoreBenchmarkView: ExpoNativeView {}

@ExpoModule("CoreBenchmarkViews", views: [CoreBenchmarkView.self])
private final class CoreBenchmarkViewsModule: Module {}
