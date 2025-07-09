// Copyright 2015-present 650 Industries. All rights reserved.

import React

// React navigation uses a safe area providere, but we don't need this.
// So we can just mock it.
@objc(MockedRNCSafeAreaProvider)
class MockedRNCSafeAreaProvider: RCTViewManager {
  // swiftlint:disable:next implicitly_unwrapped_optional
  static override func moduleName() -> String! {
    return "RNCSafeAreaProvider"
  }
}
