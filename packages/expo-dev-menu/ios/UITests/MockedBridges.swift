@testable import EXDevMenu
@testable import EXDevMenuInterface
import React

class UIMockedNOOPBridge: RCTBridge {
  override func invalidate() {
    // NOOP
  }

  override func setUp() {
    bundleURL = URL(string: "http://localhost:1234")
  }
}

class BridgeWithDevMenuExtension: UIMockedNOOPBridge {
  override func module(forName moduleName: String!) -> Any! {
    return []
  }
}
