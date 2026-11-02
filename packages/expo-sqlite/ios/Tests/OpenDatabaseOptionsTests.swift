// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore
@testable import ExpoSQLite

@Suite("OpenDatabaseOptions")
@JavaScriptActor
struct OpenDatabaseOptionsTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
  }

  @Test
  func `decodes every option to its default from an empty object`() throws {
    let options = try OpenDatabaseOptions.decode(runtime.eval("({})"), in: runtime)
    #expect(options.enableChangeListener == false)
    #expect(options.useNewConnection == false)
    #expect(options.finalizeUnusedStatementsBeforeClosing == true)
  }

  @Test
  func `decodes the provided options and keeps the rest at their defaults`() throws {
    let options = try OpenDatabaseOptions.decode(
      runtime.eval("({ useNewConnection: true, finalizeUnusedStatementsBeforeClosing: false })"),
      in: runtime
    )
    #expect(options.enableChangeListener == false)
    #expect(options.useNewConnection == true)
    #expect(options.finalizeUnusedStatementsBeforeClosing == false)
  }

  /// The module reuses a cached database only when its options equal the requested ones, so equality
  /// has to look at every option.
  @Test
  func `compares equal only when every option matches`() {
    let defaults = OpenDatabaseOptions()
    let sameDefaults = OpenDatabaseOptions()
    let newConnection = OpenDatabaseOptions(
      enableChangeListener: false,
      useNewConnection: true,
      finalizeUnusedStatementsBeforeClosing: true
    )
    #expect(defaults == sameDefaults)
    #expect(defaults != newConnection)
  }
}
