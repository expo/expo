import SwiftUI

struct ExpoViewRepresentable: UIViewControllerRepresentable {
  var moduleName: String
  var initialProperties: [String: Any] = [:]
  
  func makeUIViewController(context: Context) -> UIViewController {
    return ExpoViewController(
      moduleName: moduleName,
      initialProperties: initialProperties
    )
  }
  
  func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}

public struct ExpoView: View {
  @Environment(\.dismiss) var dismiss
  var moduleName: String
  var initialProperties: [String: Any] = [:]
  
  public init(moduleName: String, initialProperties: [String : Any] = [:]) {
    self.moduleName = moduleName
    self.initialProperties = initialProperties
  }
  
  public var body: some View {
    ExpoViewRepresentable(
      moduleName: moduleName,
      initialProperties: initialProperties
    )
  }
}
