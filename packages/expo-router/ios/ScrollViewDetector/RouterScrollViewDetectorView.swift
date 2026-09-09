import ExpoModulesCore
import UIKit

/// Zero-sized probe that expo-router renders in development as the last child of a screen's
/// content container. It inspects the container it lands in and reports, once per change, where
/// the screen's scrollable content sits, so JS can warn when react-native-screens will not find it.
class RouterScrollViewDetectorView: ExpoView {
  let onScrollViewDetected = EventDispatcher()

  private var lastReported: ScrollViewPathClassification?

  override func didMoveToWindow() {
    super.didMoveToWindow()
    guard window != nil else {
      lastReported = nil
      return
    }
    // The siblings this view is reporting on are only all in place once the current mounting
    // transaction has finished.
    DispatchQueue.main.async { [weak self] in
      self?.inspect()
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    inspect()
  }

  private func inspect() {
    guard let container = superview,
      let classification = ScrollViewPathInspector.classify(container: container),
      classification != lastReported
    else {
      return
    }
    lastReported = classification

    var firstChildPath: [String] = []
    var scrollViewPath: [String] = []
    if case .offPath(let visitedPath, let foundPath) = classification {
      firstChildPath = visitedPath
      scrollViewPath = foundPath
    }
    onScrollViewDetected([
      "classification": eventName(for: classification),
      "firstChildPath": firstChildPath,
      "scrollViewPath": scrollViewPath
    ])
  }

  private func eventName(for classification: ScrollViewPathClassification) -> String {
    switch classification {
    case .firstChild:
      return "first-child"
    case .nestedNavigator:
      return "nested-navigator"
    case .none:
      return "none"
    case .ambiguous:
      return "ambiguous"
    case .embedded:
      return "embedded"
    case .offPath:
      return "off-path"
    }
  }
}
