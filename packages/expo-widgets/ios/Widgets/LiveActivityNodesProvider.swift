import Foundation

@MainActor
final class LiveActivityNodesProvider {
  typealias Renderer = ([String: Any]) -> WidgetJavaScriptResult<[String: Any]>

  private static let cacheLimit = 2

  private struct CacheEntry {
    let environment: NSDictionary
    let nodes: [String: Any]
  }

  private let render: Renderer
  private var cache: [CacheEntry] = []

  convenience init(forName name: String, props: String?) {
    let layout = WidgetsStorage.getString(forKey: "__expo_widgets_live_activity_\(name)_layout") ?? ""
    let parsedProps = props.flatMap { props in
      props.data(using: .utf8).flatMap {
        try? JSONSerialization.jsonObject(with: $0, options: []) as? [String: Any]
      }
    }

    self.init { environment in
      evaluateWidgetLayout(layout: layout, props: parsedProps, environment: environment)
    }
  }

  init(render: @escaping Renderer) {
    self.render = render
  }

  func nodes(for environment: [String: Any]) -> [String: Any] {
    if let index = cache.firstIndex(where: { $0.environment.isEqual(to: environment) }) {
      let cached = cache.remove(at: index)
      cache.append(cached)
      return cached.nodes
    }

    let nodes: [String: Any]
    switch render(environment) {
    case .success(let result):
      nodes = result
    case .failure(let error):
      print("[ExpoWidgets] Layout evaluation failed: \(error.message)")
      nodes = ["banner": createRedBox(message: error.message)]
    }

    cache.append(CacheEntry(environment: NSDictionary(dictionary: environment), nodes: nodes))
    if cache.count > Self.cacheLimit {
      cache.removeFirst(cache.count - Self.cacheLimit)
    }
    return nodes
  }
}
