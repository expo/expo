import Foundation

private struct EmbeddedWidgetsLayoutRegistry: Decodable {
  let widgets: [String: String]
}

public enum WidgetsLayoutRegistry {
  public static func layout(for name: String) -> String? {
    if let layout = WidgetsStorage.getString(forKey: "__expo_widgets_\(name)_layout"),
       !layout.isEmpty {
      return layout
    }
    if let layout = embeddedLayouts[name],
       !layout.isEmpty {
      return layout
    }
    return nil
  }

  private static let embeddedLayouts: [String: String] = {
    guard let bundleURL = Bundle.main.url(forResource: "ExpoWidgets", withExtension: "bundle"),
          let bundle = Bundle(url: bundleURL),
          let registryURL = bundle.url(
            forResource: "ExpoWidgetsLayoutRegistry",
            withExtension: "json"
          ),
          let data = try? Data(contentsOf: registryURL),
          let registry = try? JSONDecoder().decode(EmbeddedWidgetsLayoutRegistry.self, from: data) else {
      return [:]
    }

    return registry.widgets
  }()
}
