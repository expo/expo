internal import React
import SwiftUI

private struct ExpoHostKey: EnvironmentKey {
  static let defaultValue: ExpoHost? = nil
}

private extension EnvironmentValues {
  var expoHost: ExpoHost? {
    get { self[ExpoHostKey.self] }
    set { self[ExpoHostKey.self] = newValue }
  }
}

public extension View {
  func expoHost(_ host: ExpoHost) -> some View {
    environment(\.expoHost, host)
  }
}

/// A named React root. Its host is supplied by the enclosing `.expoHost(...)` modifier.
public struct ExpoScene: View {
  @Environment(\.expoHost) private var host
  private let name: String
  private let props: [String: Any]

  public init(name: String, props: [String: Any] = [:]) {
    self.name = name
    self.props = props
  }

  public var body: some View {
    if let host {
      ExpoSceneRepresentable(host: host, name: name, props: props)
        .id(SceneIdentity(host: ObjectIdentifier(host), name: name))
    } else {
      Text("ExpoScene needs a host. Add .expoHost(host) to an enclosing view.")
    }
  }
}

private struct SceneIdentity: Hashable {
  let host: ObjectIdentifier
  let name: String
}

private struct ExpoSceneRepresentable: UIViewControllerRepresentable {
  let host: ExpoHost
  let name: String
  let props: [String: Any]

  func makeUIViewController(context: Context) -> ExpoSceneViewController {
    return ExpoSceneViewController(host: host, name: name, props: props)
  }

  func updateUIViewController(_ controller: ExpoSceneViewController, context: Context) {
    controller.updateProps(props)
  }

  static func dismantleUIViewController(_ controller: ExpoSceneViewController, coordinator: ()) {
    controller.unmount()
  }
}

private final class ExpoSceneViewController: UIViewController {
  private let host: ExpoHost
  private let name: String
  private var props: [String: Any]
  private var loadingTask: Task<Void, Never>?
  private var reactView: UIView?

  init(host: ExpoHost, name: String, props: [String: Any]) {
    self.host = host
    self.name = name
    self.props = props
    super.init(nibName: nil, bundle: nil)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func loadView() {
    view = UIView()
    loadingTask = Task { [weak self] in
      guard let self else { return }
      do {
        let root = try await host.loadView(name: name, props: props)
        guard !Task.isCancelled else {
          (root as? RCTSurfaceHostingProxyRootView)?.surface.stop()
          return
        }
        reactView = root
        root.frame = view.bounds
        root.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(root)
        (root as? RCTSurfaceHostingProxyRootView)?.appProperties = props
      } catch {
        guard !Task.isCancelled else { return }
        let label = UILabel(frame: view.bounds)
        label.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        label.numberOfLines = 0
        label.text = error.localizedDescription
        view.addSubview(label)
      }
    }
  }

  func updateProps(_ props: [String: Any]) {
    guard !NSDictionary(dictionary: self.props).isEqual(to: props) else {
      return
    }
    self.props = props
    (reactView as? RCTSurfaceHostingProxyRootView)?.appProperties = props
  }

  func unmount() {
    loadingTask?.cancel()
    loadingTask = nil
    (reactView as? RCTSurfaceHostingProxyRootView)?.surface.stop()
    reactView = nil
    // SwiftUI can query the controller's view again while removing it.
    view = UIView()
  }
}
