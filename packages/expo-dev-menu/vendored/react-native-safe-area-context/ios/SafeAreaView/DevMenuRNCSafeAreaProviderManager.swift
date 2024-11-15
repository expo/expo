import ExpoModulesCore

public final class RNCSafeAreaProviderManager: Module {
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
    syncOnMain {
      guard let window = UIApplication.shared.keyWindow else {
        return [:]
      }

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
  }
}

private func syncOnMain<T>(_ closure: () -> T) -> T {
  if !Thread.isMainThread {
    return DispatchQueue.main.sync {
      closure()
    }
  }
  return closure()
}
