import Foundation

private struct EmbeddedWidget {
  let layout: String
  let initialProps: [String: Any]?
}

public enum WidgetsLayoutRegistry {
  public static func layout(for name: String) -> String? {
    if let layout = WidgetsStorage.getString(forKey: "__expo_widgets_\(name)_layout"),
       !layout.isEmpty {
      return layout
    }
    if let embeddedWidget = embeddedWidgets[name],
       !embeddedWidget.layout.isEmpty {
      return embeddedWidget.layout
    }
    return nil
  }

  public static func initialProps(for name: String) -> [String: Any]? {
    if let props = WidgetsStorage.getDictionary(forKey: "__expo_widgets_\(name)_initial_props") {
      return props
    }
    return embeddedWidgets[name]?.initialProps
  }

  private static let embeddedWidgets: [String: EmbeddedWidget] = {
    guard let bundleURL = Bundle.main.url(forResource: "ExpoWidgets", withExtension: "bundle"),
          let bundle = Bundle(url: bundleURL),
          let registryURL = bundle.url(
            forResource: "ExpoWidgetsLayoutRegistry",
            withExtension: "json"
          ),
          let data = try? Data(contentsOf: registryURL),
          let registry = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
          let widgets = registry["widgets"] as? [String: [String: Any]] else {
      return [:]
    }

    return widgets.compactMapValues { widget in
      guard let layout = widget["layout"] as? String else {
        return nil
      }
      return EmbeddedWidget(layout: layout, initialProps: widget["initialProps"] as? [String: Any])
    }
  }()
}
