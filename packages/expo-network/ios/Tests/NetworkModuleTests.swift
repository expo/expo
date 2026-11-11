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
  let module: NetworkModule

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    module = NetworkModule(appContext: appContext)
    appContext.moduleRegistry.register(
      holder: ModuleHolder(
        appContext: appContext,
        module: module,
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
  func `a listener for another event does not stop the network monitoring`() throws {
    try runtime.eval(
      """
      globalThis.subscription = expo.modules.ExpoNetwork.addListener('onNetworkStateChanged', () => {})
      expo.modules.ExpoNetwork.addListener('onOtherEvent', () => {}).remove()
      """
    )
    defer {
      _ = try? runtime.eval("globalThis.subscription.remove()")
    }

    #expect(module.monitor.withLock { $0 != nil })
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
