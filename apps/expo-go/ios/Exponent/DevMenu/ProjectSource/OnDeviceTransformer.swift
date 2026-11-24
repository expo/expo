// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

struct ModuleTransformResult: Sendable {
  let moduleCode: String
  let dependencyNames: [String]
}

protocol ModuleTransforming: Sendable {
  func transform(source: String, filename: String, moduleId: Int, dependencyIds: [Int]) throws -> ModuleTransformResult
}

/// Runs the bundled babel payload (device-transformer.js) to turn an edited
/// source file into a spliceable `__d(...)` module. The payload executes in a
/// standalone Hermes runtime (EXOnDeviceTransformer) — Expo Go is Hermes-only,
/// so the transformer never links JavaScriptCore. This is a thin Swift adapter
/// over that ObjC++ engine.
final class OnDeviceTransformer: ModuleTransforming, @unchecked Sendable {
  private let engine: EXOnDeviceTransformer

  init() throws {
    engine = try EXOnDeviceTransformer(bundle: .main)
  }

  func transform(
    source: String, filename: String, moduleId: Int, dependencyIds: [Int]
  ) throws -> ModuleTransformResult {
    let result = try engine.transform(
      source: source,
      filename: filename,
      moduleId: moduleId,
      dependencyIds: dependencyIds.map(NSNumber.init(value:))
    )
    return ModuleTransformResult(
      moduleCode: result.code,
      dependencyNames: result.dependencyNames
    )
  }
}
