import ExpoModulesCore
import UIKit

class LinkPreviewZoomTransitionsSourceRepository {
  static var sharedRepository: LinkPreviewZoomTransitionsSourceRepository = {
    return LinkPreviewZoomTransitionsSourceRepository()
  }()
  private var sources: [String: UIView] = [:]

  private init() {}

  func registerSource(
    identifier: String,
    source: UIView
  ) {
    sources[identifier] = source
  }

  func unregisterSource(identifier: String) {
    sources.removeValue(forKey: identifier)
  }

  func getSource(identifier: String) -> UIView? {
    return sources[identifier]
  }
}

class LinkPreviewNativeZoomTransitionSource: ExpoView {
  // Keep track of the previous identifier to unregister it
  private var previousIdentifier: String?
  private var child: UIView?

  var identifier: String = "" {
    didSet {
      // Unregister old identifier if it exists
      if let oldID = previousIdentifier, !oldID.isEmpty {
        LinkPreviewZoomTransitionsSourceRepository.sharedRepository.unregisterSource(
          identifier: oldID)
      }

      // Register the new identifier if the view is in the hierarchy
      if child != nil && !identifier.isEmpty {
        LinkPreviewZoomTransitionsSourceRepository.sharedRepository.registerSource(
          identifier: identifier,
          source: child!
        )
      }

      previousIdentifier = identifier
    }
  }

  override func mountChildComponentView(
    _ childComponentView: UIView,
    index: Int
  ) {
    if child != nil {
      print(
        "ExpoRouter: LinkPreviewNativeZoomTransitionSource can only have one child view. Replacing the existing child view."
      )
      return
    }
    child = childComponentView
    if identifier.isEmpty == false {
      LinkPreviewZoomTransitionsSourceRepository.sharedRepository.registerSource(
        identifier: identifier,
        source: childComponentView
      )
    }
    super.mountChildComponentView(childComponentView, index: index)
  }

  override func unmountChildComponentView(_ child: UIView, index: Int) {
    if child == child {
      self.child = nil
      if identifier.isEmpty == false {
        LinkPreviewZoomTransitionsSourceRepository.sharedRepository.unregisterSource(
          identifier: identifier
        )
      }
    }
    super.unmountChildComponentView(child, index: index)
  }
}

class LinkPreviewNativeZoomTransitionEnabler: ExpoView {
  var zoomTransitionSourceIdentifier: String = ""

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }

  // didMoveToSuperview
  override func didMoveToSuperview() {
    // Need to run this async. Otherwise the view is not yet mounted (is it safe?)
    DispatchQueue.main.async {
      print("After didMoveToSuperview of LinkPreviewNativeZoomTransitionEnabler")
      if self.zoomTransitionSourceIdentifier.isEmpty == false,
        let controller = self.findViewController()
      {
        // From iOS 18
        if #available(iOS 18.0, *) {
          // print controller
          print("didMoveToSuperview controller", controller)
          // get screenId from controller
          let screenId = LinkPreviewNativeNavigationObjC.getScreenId(controller.view)
          print("⚠️ Found screenId: \(String(describing: screenId))")

          controller.preferredTransition = .zoom(options: nil) { context in
            let view = LinkPreviewZoomTransitionsSourceRepository.sharedRepository.getSource(
              identifier: self.zoomTransitionSourceIdentifier)
            print(
              "View from native tag \(self.zoomTransitionSourceIdentifier): \(String(describing: view))"
            )
            return view
          }
          return
        }
      } else {
        print("⚠️ No navigation controller found")
      }
    }
  }

  /// Walk up the responder chain to find the owning UIViewController
  private func findViewController() -> UIViewController? {
    var responder: UIResponder? = self
    while let r = responder {
      //      print("\(r)")
      if LinkPreviewNativeNavigationObjC.isRNScreen(r) {
        return r as? UIViewController
      }
      responder = r.next
    }
    return nil
  }
}
