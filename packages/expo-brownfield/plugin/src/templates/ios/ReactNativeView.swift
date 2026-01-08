import SwiftUI

struct ReactNativeViewRepresentable: UIViewControllerRepresentable {
  var moduleName: String
  var initialProps: [AnyHashable: Any]?
  var launchOptions: [AnyHashable: Any]?

  func makeUIViewController(context: Context) -> UIViewController {
    return ReactNativeViewController(
      moduleName: moduleName,
      initialProps: initialProps,
      launchOptions: launchOptions,
    )
  }

  func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}

public struct ReactNativeView: View {
  @Environment(\.dismiss) var dismiss

  var moduleName: String
  var initialProps: [AnyHashable: Any]? = [:]
  var launchOptions: [AnyHashable: Any]? = [:]

  public init(
    moduleName: String, 
    initialProps: [AnyHashable: Any] = [:],
    launchOptions: [AnyHashable: Any] = [:],  
  ) {
    self.moduleName = moduleName
    self.initialProps = initialProps
    self.launchOptions = launchOptions
  }

  public var body: some View {
    ReactNativeViewRepresentable(
      moduleName: moduleName, initialProps: initialProps, launchOptions: launchOptions
    )
    .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("popToNative"))) { _ in
      dismiss()
    }
  }
}