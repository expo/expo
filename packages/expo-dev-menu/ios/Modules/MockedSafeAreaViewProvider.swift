// Copyright 2015-present 650 Industries. All rights reserved.

// React navigation uses a safe area providere, but we don't need this.
// So we can just mock it.
@objc(MockedRNCSafeAreaProvider)
class MockedRNCSafeAreaProvider: RCTViewManager {
  public static override func moduleName() -> String! {
    return "RNCSafeAreaProvider"
  }
}
