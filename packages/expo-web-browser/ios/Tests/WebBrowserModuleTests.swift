// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore
@testable import ExpoWebBrowser

/// Calls the module from JavaScript, so the arguments and the results go through the same conversions
/// as in an app. The tests don't present a browser or start an authentication session.
@Suite("WebBrowserModule")
@JavaScriptActor
struct WebBrowserModuleTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(
      holder: ModuleHolder(
        appContext: appContext,
        module: WebBrowserModule(appContext: appContext),
        name: "ExpoWebBrowser"
      )
    )
    _ = try runtime.eval(
      """
      var WebBrowser = expo.modules.ExpoWebBrowser;
      // Resolves to the code of the error that rejects the promise, or to 'resolved'.
      function rejectionCode(promise) {
        return promise.then(
          function () {
            return 'resolved';
          },
          function (error) {
            return String(error.code);
          }
        );
      }
      """
    )
  }

  // MARK: - openBrowserAsync

  @Test
  func `openBrowserAsync rejects a URL that isn't http or https`() async throws {
    let result = try await runtime.evalAsync("rejectionCode(WebBrowser.openBrowserAsync('ftp://expo.dev', {}))")
    #expect(try result.asString() == WebBrowserInvalidURLException().code)
  }

  @Test
  func `openBrowserAsync rejects a URL that isn't a string`() async throws {
    let result = try await runtime.evalAsync("rejectionCode(WebBrowser.openBrowserAsync(42, {}))")
    #expect(try result.asString() == "ERR_CONVERTING_FAILED")
  }

  @Test
  func `openBrowserAsync rejects an unknown presentation style`() async throws {
    let result = try await runtime.evalAsync(
      "rejectionCode(WebBrowser.openBrowserAsync('https://expo.dev', { presentationStyle: 'sideways' }))"
    )
    #expect(try result.asString() == "ERR_ENUM_NO_SUCH_VALUE")
  }

  @Test
  func `openBrowserAsync rejects a color that isn't a color value`() async throws {
    let result = try await runtime.evalAsync(
      "rejectionCode(WebBrowser.openBrowserAsync('https://expo.dev', { toolbarColor: true }))"
    )
    #expect(try result.asString() == "ERR_CONVERTING_FAILED")
  }

  // MARK: - dismissBrowser

  @Test
  func `dismissBrowser rejects when no browser is open`() async throws {
    let result = try await runtime.evalAsync("rejectionCode(WebBrowser.dismissBrowser())")
    #expect(try result.asString() == WebBrowserNotOpenException().code)
  }

  // MARK: - Auth session

  @Test
  func `dismissAuthSession resolves when no session is open`() async throws {
    let result = try await runtime.evalAsync(
      "WebBrowser.dismissAuthSession().then(function (value) { return value === undefined; })"
    )
    #expect(try result.asBool() == true)
  }

  @Test
  func `the auth session result has null for a missing url and error`() throws {
    let result: [String: String?] = ["type": "cancel", "url": nil, "error": nil]
    let object = try [String: String?].encode(result, in: runtime).asObject()

    #expect(try object.getProperty("type").asString() == "cancel")
    #expect(object.hasProperty("url") == true)
    #expect(object.getProperty("url").isNull() == true)
    #expect(object.getProperty("error").isNull() == true)
  }

  // MARK: - Stubs

  @Test
  func `the Android functions exist for the JavaScript availability checks`() throws {
    let result = try runtime.eval(
      """
      ['warmUpAsync', 'coolDownAsync', 'mayInitWithUrlAsync', 'getCustomTabsSupportingBrowsers'].every(function (name) {
        return typeof WebBrowser[name] === 'function';
      })
      """
    )
    #expect(try result.asBool() == true)
  }
}
