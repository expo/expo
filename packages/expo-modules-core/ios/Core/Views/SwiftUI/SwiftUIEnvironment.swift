import SwiftUI

extension ExpoSwiftUI {
  public struct AppContextKey: EnvironmentKey {
    public static let defaultValue: AppContext? = nil
  }
}

extension EnvironmentValues {
  public var appContext: AppContext? {
    get { self[ExpoSwiftUI.AppContextKey.self] }
    set { self[ExpoSwiftUI.AppContextKey.self] = newValue }
  }
}
