// Copyright 2022-present 650 Industries. All rights reserved.

import ABI48_0_0React

/**
 The view that extends `ABI48_0_0RCTView` which handles some styles (e.g. borders) and accessibility.
 Inherit from `ExpoView` to keep this behavior and let your view use the associated `AppContext`.
 */
open class ExpoView: ABI48_0_0RCTView {
  /**
   A weak pointer to the associated `AppContext`.
   */
  public private(set) weak var appContext: AppContext?

  /**
   The required initializer that receives an instance of `AppContext`.
   Override it if the subclassing view needs to do something during initialization.
   */
  required public init(appContext: AppContext? = nil) {
    self.appContext = appContext
    super.init(frame: .zero)
  }

  // Mark the required init as unavailable so that subclasses can avoid overriding it.
  @available(*, unavailable)
  required public init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}
