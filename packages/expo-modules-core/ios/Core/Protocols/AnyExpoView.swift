import React

public protocol AnyExpoView: RCTView {
  var appContext: AppContext? { get }

  init(appContext: AppContext?)
}
