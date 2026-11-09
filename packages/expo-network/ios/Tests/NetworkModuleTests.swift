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
  func `adding and removing an onNetworkStateChanged listener starts and stops the network monitoring`() throws {
    try runtime.eval(
      "globalThis.subscription = expo.modules.ExpoNetwork.addListener('onNetworkStateChanged', () => {})"
    )
    #expect(module.monitor.withLock { $0 != nil })

    try runtime.eval("globalThis.subscription.remove()")
    #expect(module.monitor.withLock { $0 == nil })
  }

  @Test
  func `onNetworkStateChanged delivers the network state to a JS listener`() async throws {
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

    // The listener also starts the real monitor, so the payload is one that a real path never produces.
    module.onNetworkStateChanged(NetworkState(type: "CELLULAR", isConnected: false, isInternetReachable: false))

    let findEvent = """
      globalThis.events.find(event => JSON.parse(event).type === 'CELLULAR' && !JSON.parse(event).isConnected) ?? null
      """
    let deadline = Date().addingTimeInterval(5)
    while try runtime.eval(findEvent).isNull() && Date() < deadline {
      try await Task.sleep(nanoseconds: 50_000_000)
    }
    let state = try decodeState(runtime.eval(findEvent).asString())

    #expect(state.keys == ["isConnected", "isInternetReachable", "type"])
    #expect(state.isInternetReachable == false)
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
