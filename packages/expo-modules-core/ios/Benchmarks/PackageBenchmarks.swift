// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

/// Benchmarks for JavaScript reading the exports of a package from `expo.packages`. The package has three
/// modules and two shared object classes. A JavaScript driver runs the measured loop, so read these results
/// against `JS: empty driver loop`. `expo.packages: new package object and class read` loops in Swift instead:
/// it measures creating the package object and the first read of one export.
extension Benchmarks {
  @Test
  func `expo.packages: package read`() async throws {
    try await packageBenchmarkCase(body: "expo.packages['\(benchmarkPackageName)'];") { run, runtime in
      try benchmark("expo.packages: package read", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `expo.packages: module read`() async throws {
    try await packageBenchmarkCase(body: "p.PackageBenchmarkModule;") { run, runtime in
      try benchmark("expo.packages: module read", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `expo.packages: class read`() async throws {
    try await packageBenchmarkCase(body: "p.PackageBenchmarkPlayer;") { run, runtime in
      try benchmark("expo.packages: class read", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `expo.packages: missing export read`() async throws {
    try await packageBenchmarkCase(body: "p.Missing;") { run, runtime in
      try benchmark("expo.packages: missing export read", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `expo.packages: export names`() async throws {
    try await packageBenchmarkCase(body: "Object.keys(p);") { run, runtime in
      try benchmark("expo.packages: export names", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `expo.packages: new package object and class read`() async throws {
    try await appContextBenchmarkCase { appContext in
      registerBenchmarkPackage(in: appContext)
      let runtime = try appContext.runtime
      let package = try #require(appContext.package(named: benchmarkPackageName))
      try benchmark("expo.packages: new package object and class read", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          let packageObject = ExpoRuntimeInstaller.createPackageObject(package, appContext: appContext, runtime: runtime)
          _ = packageObject.getProperty("PackageBenchmarkPlayer")
        }
      }
    }
  }
}

private let benchmarkPackageName = "expo-benchmark"

@ExpoModule
private final class PackageBenchmarkModule: Module {}

@ExpoModule
private final class PackageBenchmarkAudioModule: Module {}

@ExpoModule
private final class PackageBenchmarkVideoModule: Module {}

@SharedObject
private final class PackageBenchmarkPlayer: SharedObject {}

@SharedObject
private final class PackageBenchmarkRecorder: SharedObject {}

@JavaScriptActor
private func registerBenchmarkPackage(in appContext: AppContext) {
  let package = ExpoPackage(
    modules: [PackageBenchmarkModule.self, PackageBenchmarkAudioModule.self, PackageBenchmarkVideoModule.self],
    sharedObjects: [PackageBenchmarkPlayer.self, PackageBenchmarkRecorder.self]
  )
  appContext.packageRegistry.register(package: package, named: benchmarkPackageName)
}

private func packageBenchmarkCase(
  body: String,
  _ measure: @escaping @JavaScriptActor (borrowing JavaScriptFunction, JavaScriptRuntime) throws -> Void
) async throws {
  try await appContextBenchmarkCase { appContext in
    registerBenchmarkPackage(in: appContext)
    let runtime = try appContext.runtime
    let run = try javaScriptDriver(runtime, setup: "var p = expo.packages['\(benchmarkPackageName)'];", body: body)
    try measure(run, runtime)
  }
}
