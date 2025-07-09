// Copyright 2022-present 650 Industries. All rights reserved.

import React

#if RCT_NEW_ARCH_ENABLED
public typealias ExpoView = ExpoFabricView
#else
/**
 The view that extends `RCTView` which handles some styles (e.g. borders) and accessibility.
 Inherit from `ExpoView` to keep this behavior and let your view use the associated `AppContext`.
 */
open class ExpoClassicView: RCTView, AnyExpoView {
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

  public func updateProps(_ rawProps: [String: Any]) {
    // Stub function – it's not used on the old architecture and non-SwiftUI views
  }

  public func supportsProp(withName name: String) -> Bool {
    // Stub function – it's not used on the old architecture and non-SwiftUI views
    return false
  }
}

public typealias ExpoView = ExpoClassicView
#endif
