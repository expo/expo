import ExpoModulesCore
import UIKit

class LinkSourceInfo {
  let alignment: CGRect?
  weak var view: UIView?

  init(alignment: CGRect?, view: UIView) {
    self.alignment = alignment
    self.view = view
  }
}

class LinkZoomTransitionsSourceRepository {
  static var sharedRepository: LinkZoomTransitionsSourceRepository = {
    return LinkZoomTransitionsSourceRepository()
  }()
  private var sources: [String: LinkSourceInfo] = [:]
  private let lock = NSLock()

  private init() {}

  func registerSource(
    identifier: String,
    source: LinkSourceInfo
  ) {
    lock.lock()
    defer { lock.unlock() }
    if sources[identifier] != nil {
      print(
        "[expo-router] LinkPreviewZoomTransitionSource with identifier \(identifier) is already registered. Overwriting the existing source."
      )
    }
    if !identifier.isEmpty {
      sources[identifier] = source
    }
  }

  func unregisterSource(identifier: String) {
    lock.lock()
    defer { lock.unlock() }
    sources.removeValue(forKey: identifier)
  }

  func getSource(identifier: String) -> LinkSourceInfo? {
    lock.lock()
    defer { lock.unlock() }
    return sources[identifier]
  }

  func updateIdentifier(
    oldIdentifier: String,
    newIdentifier: String
  ) {
    lock.lock()
    defer { lock.unlock() }
    if let source = sources[oldIdentifier] {
      if !newIdentifier.isEmpty {
        sources[newIdentifier] = source
      }
      sources.removeValue(forKey: oldIdentifier)
    }
  }

  func updateAlignment(
    identifier: String,
    alignment: CGRect?
  ) {
    lock.lock()
    defer { lock.unlock() }
    if let source = sources[identifier], let view = source.view, !identifier.isEmpty {
      sources[identifier] = LinkSourceInfo(
        alignment: alignment,
        view: view
      )
    }
  }
}

class LinkZoomTransitionSource: ExpoView {
  private var child: UIView?
  var alignment: CGRect? {
    didSet {
      // Update alignment info in the repository
      if child != nil {
        LinkZoomTransitionsSourceRepository.sharedRepository.updateAlignment(
          identifier: identifier,
          alignment: alignment
        )
      }
    }
  }

  var identifier: String = "" {
    didSet {
      guard identifier != oldValue else { return }
      if let child = child {
        if oldValue.isEmpty {
          LinkZoomTransitionsSourceRepository.sharedRepository.registerSource(
            identifier: identifier,
            source: LinkSourceInfo(alignment: alignment, view: child)
          )
        } else {
          LinkZoomTransitionsSourceRepository.sharedRepository.updateIdentifier(
            oldIdentifier: oldValue,
            newIdentifier: identifier
          )
        }
      } else {
        LinkZoomTransitionsSourceRepository.sharedRepository.unregisterSource(
          identifier: oldValue
        )
      }
    }
  }

  override func mountChildComponentView(
    _ childComponentView: UIView,
    index: Int
  ) {
    if child != nil {
      print(
        "[expo-router] LinkZoomTransitionSource can only have one child view."
      )
      return
    }
    child = childComponentView
    LinkZoomTransitionsSourceRepository.sharedRepository.registerSource(
      identifier: identifier,
      source: LinkSourceInfo(alignment: alignment, view: childComponentView)
    )
    super.mountChildComponentView(childComponentView, index: index)
  }

  override func unmountChildComponentView(_ child: UIView, index: Int) {
    if child == self.child {
      self.child = nil
      LinkZoomTransitionsSourceRepository.sharedRepository.unregisterSource(
        identifier: identifier
      )
    }
    super.unmountChildComponentView(child, index: index)
  }
}

class LinkZoomTransitionEnabler: ExpoView {
  var zoomTransitionSourceIdentifier: String = ""

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }

  override func didMoveToSuperview() {
    super.didMoveToSuperview()
    if superview != nil {
      // Need to run this async. Otherwise the view has no view controller yet
      DispatchQueue.main.async {
        self.setupZoomTransition()
      }
    }
  }

  func setupZoomTransition() {
    if self.zoomTransitionSourceIdentifier.isEmpty {
      print("[expo-router] No zoomTransitionSourceIdentifier passed to LinkZoomTransitionEnabler")
      return
    }
    if let controller = self.findViewController() {
      if #available(iOS 18.0, *) {
        let options = UIViewController.Transition.ZoomOptions()

        options.alignmentRectProvider = { _ in
          let sourceInfo = LinkZoomTransitionsSourceRepository.sharedRepository.getSource(
            identifier: self.zoomTransitionSourceIdentifier)
          return sourceInfo?.alignment
        }
        controller.preferredTransition = .zoom(options: options) { _ in
          let sourceInfo = LinkZoomTransitionsSourceRepository.sharedRepository.getSource(
            identifier: self.zoomTransitionSourceIdentifier)
          var view: UIView? = sourceInfo?.view
          if let linkPreviewView = view as? NativeLinkPreviewView {
            view = linkPreviewView.directChild
          }
          guard let view else {
            print(
              "[expo-router] No source view found for identifier \(self.zoomTransitionSourceIdentifier) to enable zoom transition"
            )
            return nil
          }
          return view
        }
        return
      }
    } else {
      print("[expo-router] No navigation controller found to enable zoom transition")
    }
  }

  private func findViewController() -> UIViewController? {
    var responder: UIResponder? = self
    while let r = responder {
      if LinkPreviewNativeNavigationObjC.isRNScreen(r) {
        return r as? UIViewController
      }
      responder = r.next
    }
    return nil
  }
}
