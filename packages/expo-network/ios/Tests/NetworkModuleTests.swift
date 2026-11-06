// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Foundation
import Testing

@testable import ExpoModulesCore
@testable import ExpoNetwork

@Suite("NetworkModule")
@JavaScriptActor
struct NetworkModuleTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(
      holder: ModuleHolder(
        appContext: appContext,
        module: NetworkModule(appContext: appContext),
        name: "ExpoNetwork"
      )
    )
  }

  @Test
  func `getNetworkStateAsync resolves to a network state object`() async throws {
    let result = try await runtime.evalAsync(
      """
      expo.modules.ExpoNetwork.getNetworkStateAsync().then(state => JSON.stringify({
        keys: Object.keys(state).sort(),
        type: state.type,
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      }))
      """
    )
    let state = try decodeState(result.asString())

    #expect(state.keys == ["isConnected", "isInternetReachable", "type"])
    #expect(["NONE", "UNKNOWN", "CELLULAR", "WIFI", "ETHERNET"].contains(state.type))
    #expect(state.isInternetReachable == state.isConnected)
    #expect((state.type == "NONE") == !state.isConnected)
  }

  @Test
  func `getIpAddressAsync resolves to an IPv4 address`() async throws {
    let result = try await runtime.evalAsync("expo.modules.ExpoNetwork.getIpAddressAsync()")
    let address = try result.asString()

    #expect(address.split(separator: ".").compactMap { UInt8($0) }.count == 4)
  }

  @Test
  func `adding an onNetworkStateChanged listener emits the current network state`() async throws {
    try runtime.eval(
      """
      globalThis.events = []
      globalThis.subscription = expo.modules.ExpoNetwork.addListener('onNetworkStateChanged', state => {
        globalThis.events.push(JSON.stringify({
          keys: Object.keys(state).sort(),
          type: state.type,
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable,
        }))
      })
      """
    )
    defer {
      _ = try? runtime.eval("globalThis.subscription.remove()")
    }

    let deadline = Date().addingTimeInterval(5)
    while try runtime.eval("globalThis.events.length").asInt() == 0 && Date() < deadline {
      try await Task.sleep(nanoseconds: 50_000_000)
    }
    let state = try decodeState(runtime.eval("globalThis.events[0] ?? '{}'").asString())

    #expect(state.keys == ["isConnected", "isInternetReachable", "type"])
    #expect(state.isInternetReachable == state.isConnected)
  }

  private struct DecodedState: Decodable {
    let keys: [String]
    let type: String
    let isConnected: Bool
    let isInternetReachable: Bool
  }

  private func decodeState(_ json: String) throws -> DecodedState {
    return try JSONDecoder().decode(DecodedState.self, from: Data(json.utf8))
  }
}
