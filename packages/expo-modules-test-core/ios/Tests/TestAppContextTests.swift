// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Testing

@testable import ExpoModulesTestCore

@Suite("TestAppContext")
@JavaScriptActor
struct TestAppContextTests {
  @Test
  func `promise reactions run after the synchronous code`() async throws {
    let appContext = TestAppContext()
    let runtime = try appContext.runtime
    let result = try await runtime.evalAsync(
      """
      (() => {
        const log = [];
        Promise.resolve().then(() => log.push('then'));
        log.push('sync');
        return Promise.resolve().then(() => log.join(','));
      })()
      """
    ).ref()
    // `evalAsync` resumes off the JavaScript thread, so the result is read on it.
    #expect(try await runtime.execute { try result.take().asString() } == "sync,then")
  }

  @Test
  func `awaits in a loop do not grow the native stack`() async throws {
    let appContext = TestAppContext()
    let runtime = try appContext.runtime
    let result = try await runtime.evalAsync(
      """
      (async () => {
        for (let i = 0; i < 10000; i++) {
          await null;
        }
        return 'done';
      })()
      """
    ).ref()
    #expect(try await runtime.execute { try result.take().asString() } == "done")
  }
}
