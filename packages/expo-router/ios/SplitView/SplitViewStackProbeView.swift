import ExpoModulesCore
import UIKit

// Local scope probe: records containment without changing bars, controllers, or delegates.
class SplitViewStackProbeView: ExpoView {
  var revision = 0
  let onSnapshot = EventDispatcher()
  private var lastRevision: Int?

  override func didMoveToWindow() {
    super.didMoveToWindow()
    lastRevision = nil
    snapshotIfRequested()
  }

  func snapshotIfRequested() {
    guard window != nil, lastRevision != revision else {
      return
    }
    lastRevision = revision

    var responder: UIResponder? = next
    while let current = responder, !(current is UIViewController) {
      responder = current.next
    }
    var controller = responder as? UIViewController
    var controllers: [String] = []
    var navigationControllers: [[String: Any]] = []
    var splitState = "not-found"
    while let current = controller {
      controllers.append(String(describing: type(of: current)))
      if let navigation = current as? UINavigationController {
        navigationControllers.append([
          "name": String(describing: type(of: navigation)),
          "depth": navigation.viewControllers.count,
          "headerHidden": navigation.isNavigationBarHidden,
          "gestures": (navigation.view.gestureRecognizers ?? []).map { gesture in
            var isContentPop = false
            if #available(iOS 26.0, *) {
              isContentPop = gesture === navigation.interactiveContentPopGestureRecognizer
            }
            return [
              "name": String(describing: type(of: gesture)),
              "enabled": gesture.isEnabled,
              "state": gesture.state.rawValue,
              "delegate": gesture.delegate.map { String(describing: type(of: $0)) } ?? "none",
              "isInteractivePop": gesture === navigation.interactivePopGestureRecognizer,
              "isContentPop": isContentPop,
            ] as [String: Any]
          },
          "markerInTopScreen": navigation.topViewController?.viewIfLoaded.map { isDescendant(of: $0) } ?? false,
        ])
      }
      if let split = current as? UISplitViewController {
        splitState = split.isCollapsed ? "collapsed" : "expanded"
      }
      controller = current.parent
    }
    onSnapshot([
      "revision": revision,
      "controllers": controllers,
      "navigationControllers": navigationControllers,
      "splitState": splitState,
    ])
  }

}
