// Copyright 2022-present 650 Industries. All rights reserved.

#if RCT_NEW_ARCH_ENABLED
public typealias ExpoView = ExpoFabricView
#else
  /// The base view class for expo modules in Paper architecture.
  /// Inherit from `ExpoView` to let your view use the associated `AppContext`.
  open class ExpoClassicView: UIView, AnyExpoView {
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
