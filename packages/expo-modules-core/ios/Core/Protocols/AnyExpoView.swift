// Note: We use UIView as the base constraint (not RCTView or RCTViewComponentView)
// to avoid re-exporting React types in the xcframework's swiftinterface.
// Both RCTViewComponentView (Fabric) and RCTView (Paper) inherit from UIView.
public protocol AnyExpoView: UIView {
  var appContext: AppContext? { get }

  init(appContext: AppContext?)

  // Only used on Fabric and SwiftUI
  func updateProps(_ rawProps: [String: Any])

  // Only used on Fabric and SwiftUI
  func supportsProp(withName name: String) -> Bool
}
