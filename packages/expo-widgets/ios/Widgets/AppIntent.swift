import AppIntents
import JavaScriptCore
import WidgetKit

@available(iOS 16.0, *)
struct WidgetUserInteraction: AppIntent {
  static var title: LocalizedStringResource = "User Interaction"
  static var isDiscoverable: Bool = false
  @Parameter(title: "source")
  var source: String?

  @Parameter(title: "target")
  var target: String?
  
  init() {}
  init(source: String?, target: String?) {
    self.source = source
    self.target = target
  }
  
  func perform() async throws -> some IntentResult {
    guard let source else {
      return .result()
    }

    WidgetsEvents.shared.sendNotification(type: .userEvent, data: [
      "source": source as Any,
      "target": target as Any,
      "timestamp": Date().timeIntervalSince1970
    ])
    
    WidgetCenter.shared.reloadTimelines(ofKind: source)

    return .result()
  }
}

@available(iOS 16.0, *)
struct LiveActivityUserInteraction: LiveActivityIntent {
  static var title: LocalizedStringResource = "User Interaction"
  static var isDiscoverable: Bool = false
  
  @Parameter(title: "source")
  var source: String?

  @Parameter(title: "target")
  var target: String?
  
  init() {}
  init(source: String?, target: String?) {
    self.source = source
    self.target = target
  }
  
  func perform() async throws -> some IntentResult {
    WidgetsEvents.shared.sendNotification(type: .userEvent, data: [
      "source": source as Any,
      "target": target as Any,
      "timestamp": Date().timeIntervalSince1970
    ])

    return .result()
  }
}
