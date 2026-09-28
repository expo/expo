// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Testing

@testable import ExpoSQLite

@Suite("OpenDatabaseOptions")
struct OpenDatabaseOptionsTests {
  private let appContext = AppContext()

  @Test
  func `decodes every option to its default from an empty dictionary`() throws {
    let options = try OpenDatabaseOptions.from(dictionary: [:], appContext: appContext)
    #expect(options.enableChangeListener == false)
    #expect(options.useNewConnection == false)
    #expect(options.finalizeUnusedStatementsBeforeClosing == true)
  }

  @Test
  func `decodes the provided options and keeps the rest at their defaults`() throws {
    let options = try OpenDatabaseOptions.from(
      dictionary: ["useNewConnection": true, "finalizeUnusedStatementsBeforeClosing": false],
      appContext: appContext
    )
    #expect(options.enableChangeListener == false)
    #expect(options.useNewConnection == true)
    #expect(options.finalizeUnusedStatementsBeforeClosing == false)
  }

  /// The module reuses a cached database only when its options equal the requested ones, so equality
  /// has to look at every option.
  @Test
  func `compares equal only when every option matches`() throws {
    let defaults = try OpenDatabaseOptions.from(dictionary: [:], appContext: appContext)
    let sameDefaults = try OpenDatabaseOptions.from(dictionary: [:], appContext: appContext)
    let newConnection = try OpenDatabaseOptions.from(
      dictionary: ["useNewConnection": true],
      appContext: appContext
    )
    #expect(defaults == sameDefaults)
    #expect(defaults != newConnection)
  }
}
