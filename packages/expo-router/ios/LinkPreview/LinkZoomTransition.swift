import ExpoModulesCore
import RNScreens
import UIKit

class LinkSourceInfo {
  let alignment: CGRect?
  weak var view: UIView?

  init(view: UIView, alignment: CGRect?) {
    self.alignment = alignment
    self.view = view
  }
}

class LinkZoomTransitionsSourceRepository {
  private var sources: [String: LinkSourceInfo] = [:]
  private let lock = NSLock()

  init() {}

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
        view: view,
        alignment: alignment,
      )
    }
  }
}

class LinkZoomTransitionsAlignmentViewRepository {
  private var alignmentViews: [String: WeakUIView] = [:]
  private let lock = NSLock()

  init() {}

  func addIfNotExists(
    identifier: String,
    alignmentView: UIView
  ) {
    lock.lock()
    defer { lock.unlock() }
    if alignmentViews[identifier] == nil && !identifier.isEmpty {
      alignmentViews[identifier] = WeakUIView(view: alignmentView)
    }
  }

  func removeIfSame(
    identifier: String,
    alignmentView: UIView
  ) {
    lock.lock()
    defer { lock.unlock() }
    if let existing = alignmentViews[identifier], existing.view === alignmentView {
      alignmentViews.removeValue(forKey: identifier)
    }
  }

  func get(identifier: String) -> UIView? {
    lock.lock()
    defer { lock.unlock() }
    return alignmentViews[identifier]?.view
  }

  private class WeakUIView {
    weak var view: UIView?

    init(view: UIView) {
      self.view = view
    }
  }
}

class LinkZoomTransitionSource: LinkZoomExpoView, LinkPreviewIndirectTriggerProtocol {
  var child: UIView?

  var indirectTrigger: UIView? {
    return child
  }

  var alignment: CGRect? {
    didSet {
      // Update alignment info in the sourceRepository
      if child != nil {
        sourceRepository?.updateAlignment(
          identifier: identifier,
          alignment: alignment
        )
      }
    }
  }

  var identifier: String = "" {
    didSet {
      guard identifier != oldValue else { return }
      if let child {
        if oldValue.isEmpty {
          sourceRepository?.registerSource(
            identifier: identifier,
            source: LinkSourceInfo(view: child, alignment: alignment)
          )
        } else {
          sourceRepository?.updateIdentifier(
            oldIdentifier: oldValue,
            newIdentifier: identifier
          )
        }
      } else {
        sourceRepository?.unregisterSource(
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
    sourceRepository?.registerSource(
      identifier: identifier,
      source: LinkSourceInfo(view: childComponentView, alignment: alignment)
    )
    super.mountChildComponentView(childComponentView, index: index)
  }

  override func unmountChildComponentView(_ child: UIView, index: Int) {
    if child == self.child {
      self.child = nil
      sourceRepository?.unregisterSource(
        identifier: identifier
      )
    }
    super.unmountChildComponentView(child, index: index)
  }
}

class LinkZoomTransitionAlignmentRectDetector: LinkZoomExpoView {
  private var child: UIView?

  var identifier: String = "" {
    didSet {
      if oldValue != identifier && !oldValue.isEmpty {
        print(
          "[expo-router] LinkZoomTransitionAlignmentRectDetector does not support changing the identifier after it has been set."
        )
        return
      }
      if let child = child {
        alignmentViewRepository?.addIfNotExists(
          identifier: identifier,
          alignmentView: child
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
        "[expo-router] LinkZoomTransitionAlignmentRectDetector can only have one child view."
      )
      return
    }
    if !identifier.isEmpty {
      alignmentViewRepository?.addIfNotExists(
        identifier: identifier,
        alignmentView: childComponentView
      )
    }
    self.child = childComponentView
    super.mountChildComponentView(childComponentView, index: index)
  }

  override func unmountChildComponentView(_ child: UIView, index: Int) {
    if child == self.child {
      self.child = nil
      alignmentViewRepository?.removeIfSame(
        identifier: identifier,
        alignmentView: child
      )
    }
    super.unmountChildComponentView(child, index: index)
  }
}

class LinkZoomTransitionEnabler: LinkZoomExpoView {
  var zoomTransitionSourceIdentifier: String = ""
  var isPreventingInteractiveDismissal: Bool = false

  override func didMoveToSuperview() {
    super.didMoveToSuperview()
    if superview != nil {
      // Need to run this async. Otherwise the view has no view controller yet
      DispatchQueue.main.async {
        self.setupZoomTransition()
      }
    }
  }

  private func setupZoomTransition() {
    if self.zoomTransitionSourceIdentifier.isEmpty {
      print("[expo-router] No zoomTransitionSourceIdentifier passed to LinkZoomTransitionEnabler")
      return
    }
    if let controller = self.findViewController() {
      if #available(iOS 18.0, *) {
        let options = UIViewController.Transition.ZoomOptions()

        options.alignmentRectProvider = { context in
          let sourceInfo = self.sourceRepository?.getSource(
            identifier: self.zoomTransitionSourceIdentifier)
          let alignmentView = self.alignmentViewRepository?.get(
            identifier: self.zoomTransitionSourceIdentifier)
          if let alignmentView = alignmentView {
            return alignmentView.convert(
              alignmentView.bounds,
              to: context.zoomedViewController.view
            )
          }
          return sourceInfo?.alignment
        }
        options.interactiveDismissShouldBegin = { _ in
          !self.isPreventingInteractiveDismissal
        }
        controller.preferredTransition = .zoom(options: options) { _ in
          let sourceInfo = self.sourceRepository?.getSource(
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

  private func findViewController() -> RNSScreen? {
    var responder: UIResponder? = self
    while let r = responder {
      if let r = r as? RNSScreen {
        return r
      }
      responder = r.next
    }
    return nil
  }
}

class LinkZoomExpoView: ExpoView {
  var module: LinkPreviewNativeModule? {
    return appContext?.moduleRegistry.get(moduleWithName: LinkPreviewNativeModule.moduleName)
      as? LinkPreviewNativeModule
  }

  var sourceRepository: LinkZoomTransitionsSourceRepository? {
    guard let module else {
      print("[expo-router] LinkPreviewNativeModule not loaded")
      return nil
    }
    return module.zoomSourceRepository
  }

  var alignmentViewRepository: LinkZoomTransitionsAlignmentViewRepository? {
    guard let module else {
      print("[expo-router] LinkPreviewNativeModule not loaded")
      return nil
    }
    return module.zoomAlignmentViewRepository
  }
}
