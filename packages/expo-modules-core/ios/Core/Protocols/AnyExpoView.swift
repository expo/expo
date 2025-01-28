import React

public protocol AnyExpoView: RCTView {
  var appContext: AppContext? { get }

  init(appContext: AppContext?)

  // Only used on Fabric and SwiftUI
  func updateProps(_ rawProps: [String: Any])

  // Only used on Fabric and SwiftUI
  func supportsProp(withName name: String) -> Bool
}
