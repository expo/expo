import ExpoModulesCore

// Shared AppContext for widgets
struct WidgetsContext {
  static let shared = WidgetsContext()
  let context: AppContext = AppContext()
}
