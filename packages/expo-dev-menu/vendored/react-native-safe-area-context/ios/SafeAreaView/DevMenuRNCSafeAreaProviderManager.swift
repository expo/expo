import ExpoModulesCore

public class RNCSafeAreaProviderManager: Module {
  public func definition() -> ModuleDefinition {
    Name("RNCSafeAreaProvider")
    Constants([
      "initialWindowMetrics": self.initialWindowMetrics
    ])

    View(SafeAreaProvider.self) {
      Events("onInsetsChange")
    }
  }

  private var initialWindowMetrics: [String: Any]? {
    guard let window = UIApplication.shared.keyWindow else {
      return [:]
    }

    if #available(iOS 11.0, *) {
      let safeAreaInsets = window.safeAreaInsets

      return [
        "insets": [
          "top": safeAreaInsets.top,
          "right": safeAreaInsets.right,
          "bottom": safeAreaInsets.bottom,
          "left": safeAreaInsets.left
        ],
        "frame": [
          "x": window.frame.origin.x,
          "y": window.frame.origin.y,
          "width": window.frame.size.width,
          "height": window.frame.size.height
        ]
      ]
    }

    return [
      "insets": [
        "top": 20,
        "right": 0,
        "bottom": 0,
        "left": 0
      ],
      "frame": [
        "x": window.frame.origin.x,
        "y": window.frame.origin.y,
        "width": window.frame.size.width,
        "height": window.frame.size.height
      ]
    ]
  }
}
