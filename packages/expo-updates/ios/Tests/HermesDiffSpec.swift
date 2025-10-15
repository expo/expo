//  Copyright (c) 2024 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore
import Foundation

@testable import EXUpdates

class HermesDiffSpecForBundle {}

class HermesDiffSpec : ExpoSpec {
  override class func spec() {
    describe("Hermes bytecode diffing") {
      it("should successfully apply diff using real bytecode files") {
        let bundle = Bundle(for: HermesDiffSpecForBundle.self)

        let oldHbcPath = bundle.path(forResource: "old", ofType: "hbc")!
        let expectedHbcPath = bundle.path(forResource: "new", ofType: "hbc")!
        let patchPath = bundle.path(forResource: "test", ofType: "patch")!

        let tempDir = FileManager.default.temporaryDirectory
        let resultHbcPath = tempDir.appendingPathComponent("result.hbc").path

        try BSPatch.applyPatch(
          oldPath: oldHbcPath,
          newPath: resultHbcPath,
          patchPath: patchPath
        )

        let expectedData = try Data(contentsOf: URL(fileURLWithPath: expectedHbcPath))
        let resultData = try Data(contentsOf: URL(fileURLWithPath: resultHbcPath))

        expect(resultData).to(equal(expectedData))

        try? FileManager.default.removeItem(atPath: resultHbcPath)
      }

      it("should handle bad patch") {
        let tempDir = FileManager.default.temporaryDirectory
        let oldHbcUrl = tempDir.appendingPathComponent("old_corrupt.hbc")
        let resultHbcUrl = tempDir.appendingPathComponent("result_corrupt.hbc")
        let corruptPatchUrl = tempDir.appendingPathComponent("corrupt.patch")

        let dummyData = Data("dummy hermes bytecode".utf8)
        try dummyData.write(to: oldHbcUrl)

        // Create bad patch (random data)
        let corruptPatchData = Data((0..<1024).map { _ in UInt8.random(in: 0...255) })
        try corruptPatchData.write(to: corruptPatchUrl)
        
        expect {
          try BSPatch.applyPatch(
            oldPath: oldHbcUrl.path,
            newPath: resultHbcUrl.path,
            patchPath: corruptPatchUrl.path
          )
        }.to(throwError { (error: BSPatchError) in
          if case .failed(let message) = error {
            expect(message).toNot(beEmpty())
          }
        })

        try? FileManager.default.removeItem(at: oldHbcUrl)
        try? FileManager.default.removeItem(at: resultHbcUrl)
        try? FileManager.default.removeItem(at: corruptPatchUrl)
      }
    }
  }
}
