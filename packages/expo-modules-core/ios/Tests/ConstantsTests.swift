// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("Constants")
struct ConstantsTests {
  let appContext = AppContext()

  @Test
  func `takes closure resolving to dictionary`() {
    let holder = mockModuleHolder(appContext) {
      Constants {
        return ["test": 123]
      }
    }
    #expect(holder.getLegacyConstants()["test"] as? Int == 123)
  }

  @Test
  func `takes the dictionary`() {
    let holder = mockModuleHolder(appContext) {
      Constants(["test": 123])
    }
    #expect(holder.getLegacyConstants()["test"] as? Int == 123)
  }

  @Test
  func `merges multiple constants definitions`() {
    let holder = mockModuleHolder(appContext) {
      Constants(["test": 456, "test2": 789])
      Constants(["test": 123])
    }
    let consts = holder.getLegacyConstants()
    #expect(consts["test"] as? Int == 123)
    #expect(consts["test2"] as? Int == 789)
  }
}
