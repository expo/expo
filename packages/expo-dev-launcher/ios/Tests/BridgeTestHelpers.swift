// Copyright 2015-present 650 Industries. All rights reserved.

import Quick
import Nimble
import React

@testable import EXDevLauncher

internal class MockBridgeDelegate: NSObject, RCTBridgeDelegate {
  var loadSourceCalled = false

  func sourceURL(for bridge: RCTBridge) -> URL? {
    return URL(string: "http://localhost:8081/index.bundle")
  }

  func loadSource(for bridge: RCTBridge, onProgress: @escaping RCTSourceLoadProgressBlock, onComplete loadCallback: @escaping RCTSourceLoadBlock) {
    loadSourceCalled = true

    // Executes callback nil for both error and source looks strange but that's the only way we can bypass the lock
    loadCallback(nil, nil)
  }
}

internal func waitBridgeReady(bridgeDelegate: MockBridgeDelegate) {
  expect(bridgeDelegate.loadSourceCalled).toEventually(beTrue())
}
