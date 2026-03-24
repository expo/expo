import SwiftUI

struct ${{prefix}}ReactNativeViewRepresentable: UIViewControllerRepresentable {
  var moduleName: String
  var initialProps: [AnyHashable: Any]?
  var launchOptions: [AnyHashable: Any]?

  func makeUIViewController(context: Context) -> UIViewController {
    return ${{prefix}}ReactNativeViewController(
      moduleName: moduleName,
      initialProps: initialProps,
      launchOptions: launchOptions,
    )
  }

  func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}

public struct ${{prefix}}ReactNativeView: View {
  @Environment(\.dismiss) var dismiss

  var moduleName: String
  var initialProps: [AnyHashable: Any]? = [:]
  var launchOptions: [AnyHashable: Any]? = [:]

  public init(
    moduleName: String = "main",
    initialProps: [AnyHashable: Any] = [:],
    launchOptions: [AnyHashable: Any] = [:],
  ) {
    self.moduleName = moduleName
    self.initialProps = initialProps
    self.launchOptions = launchOptions
  }

  public var body: some View {
    ${{prefix}}ReactNativeViewRepresentable(
      moduleName: moduleName, initialProps: initialProps, launchOptions: launchOptions
    )
    .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("popToNative"))) { _ in
      dismiss()
    }
  }
}
