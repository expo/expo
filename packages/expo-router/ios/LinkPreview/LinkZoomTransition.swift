import ExpoModulesCore
import RNScreens
import UIKit

class LinkSourceInfo {
  var alignment: CGRect?
  var animateAspectRatioChange: Bool
  weak var view: UIView?

  init(view: UIView, alignment: CGRect?, animateAspectRatioChange: Bool) {
    self.view = view
    self.alignment = alignment
    self.animateAspectRatioChange = animateAspectRatioChange
  }
}

class LinkZoomTransitionsSourceRepository {
  private var sources: [String: LinkSourceInfo] = [:]
  private let lock = NSLock()

  private weak var logger: ExpoModulesCore.Logger?

  init(logger: ExpoModulesCore.Logger?) {
    self.logger = logger
  }

  func registerSource(
    identifier: String,
    source: LinkSourceInfo
  ) {
    lock.lock()
    defer { lock.unlock() }
    if sources[identifier] != nil {
      logger?.warn(
        "[expo-router] Link.AppleZoom with identifier \(identifier) is already registered. This means that you used two sources for the same target, which is not supported and may lead to unexpected behavior."
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
    if let source = sources[identifier], !identifier.isEmpty {
      source.alignment = alignment
    }
  }

  func updateAnimateAspectRatioChange(
    identifier: String,
    animateAspectRatioChange: Bool
  ) {
    lock.lock()
    defer { lock.unlock() }
    if let source: LinkSourceInfo = sources[identifier], !identifier.isEmpty {
      source.animateAspectRatioChange = animateAspectRatioChange
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
      if child != nil {
        sourceRepository?.updateAlignment(
          identifier: identifier,
          alignment: alignment
        )
      }
    }
  }

  var animateAspectRatioChange: Bool = false {
    didSet {
      if child != nil {
        sourceRepository?.updateAnimateAspectRatioChange(
          identifier: identifier,
          animateAspectRatioChange: animateAspectRatioChange
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
            source: LinkSourceInfo(
              view: child, alignment: alignment,
              animateAspectRatioChange: animateAspectRatioChange)
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
    guard child == nil else {
      logger?.warn(
        "[expo-router] Link.AppleZoom can only have a single native child. If you passed a single child, consider adding collapsible={false} to your component"
      )
      return
    }
    child = childComponentView
    sourceRepository?.registerSource(
      identifier: identifier,
      source: LinkSourceInfo(
        view: childComponentView, alignment: alignment,
        animateAspectRatioChange: animateAspectRatioChange)
    )
    super.mountChildComponentView(childComponentView, index: index)
  }

  override func unmountChildComponentView(_ child: UIView, index: Int) {
    guard child == self.child else {
      return
    }
    self.child = nil
    sourceRepository?.unregisterSource(
      identifier: identifier
    )
    super.unmountChildComponentView(child, index: index)
  }
}

class LinkZoomTransitionAlignmentRectDetector: LinkZoomExpoView {
  private var child: UIView?

  var identifier: String = "" {
    didSet {
      if oldValue != identifier && !oldValue.isEmpty {
        logger?.warn(
          "[expo-router] LinkZoomTransitionAlignmentRectDetector does not support changing the identifier after it has been set. This is most likely an internal bug in expo-router."
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
    guard child == nil else {
      logger?.warn(
        "[expo-router] Link.AppleZoomTarget can only have a single native child. If you passed a single child, consider adding collapsible={false} to your component"
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
    guard child == self.child else {
      return
    }
    self.child = nil
    alignmentViewRepository?.removeIfSame(
      identifier: identifier,
      alignmentView: child
    )
    super.unmountChildComponentView(child, index: index)
  }
}

class LinkZoomTransitionEnabler: LinkZoomExpoView {
  var zoomTransitionSourceIdentifier: String = ""
  var dismissalBoundsRect: DismissalBoundsRect? {
    didSet {
      // When dismissalBoundsRect changes, re-setup the zoom transition
      // to include/exclude interactiveDismissShouldBegin callback
      if superview != nil {
        DispatchQueue.main.async {
          self.setupZoomTransition()
        }
      }
    }
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

  private func setupZoomTransition() {
    if self.zoomTransitionSourceIdentifier.isEmpty {
      logger?.warn("[expo-router] No zoomTransitionSourceIdentifier passed to LinkZoomTransitionEnabler. This is most likely a bug in expo-router.")
      return
    }
    if let controller = self.findViewController() {
      if #available(iOS 18.0, *) {
        let options = UIViewController.Transition.ZoomOptions()

        options.alignmentRectProvider = { context in
          guard
            let sourceInfo = self.sourceRepository?.getSource(
              identifier: self.zoomTransitionSourceIdentifier)
          else {
            return nil
          }
          guard
            let alignmentView = self.alignmentViewRepository?.get(
              identifier: self.zoomTransitionSourceIdentifier)
          else {
            return sourceInfo.alignment
          }

          let rect = alignmentView.convert(
            alignmentView.bounds,
            to: context.zoomedViewController.view
          )
          if sourceInfo.animateAspectRatioChange,
            let sourceView = sourceInfo.view {
            return self.calculateAdjustedRect(rect, toMatch: sourceView.bounds.size)
          }
          return rect
        }
        // Only set up interactiveDismissShouldBegin when dismissalBoundsRect is set
        // If dismissalBoundsRect is nil, don't set the callback - iOS uses default behavior
        if let rect = self.dismissalBoundsRect {
          options.interactiveDismissShouldBegin = { context in
            let location = context.location
            // Check each optional bound independently
            if let minX = rect.minX, location.x < minX { return false }
            if let maxX = rect.maxX, location.x > maxX { return false }
            if let minY = rect.minY, location.y < minY { return false }
            if let maxY = rect.maxY, location.y > maxY { return false }
            return true
          }
        }
        controller.preferredTransition = .zoom(options: options) { _ in
          let sourceInfo = self.sourceRepository?.getSource(
            identifier: self.zoomTransitionSourceIdentifier)
          var view: UIView? = sourceInfo?.view
          if let linkPreviewView = view as? NativeLinkPreviewView {
            view = linkPreviewView.directChild
          }
          guard let view else {
            self.logger?.warn(
              "[expo-router] No source view found for identifier \(self.zoomTransitionSourceIdentifier) to enable zoom transition. This is most likely a bug in expo-router."
            )
            return nil
          }
          return view
        }
        return
      }
    } else {
      logger?.warn("[expo-router] No navigation controller found to enable zoom transition. This is most likely a bug in expo-router.")
    }
  }

  private func calculateAdjustedRect(
    _ rect: CGRect, toMatch sourceSize: CGSize
  ) -> CGRect {
    guard sourceSize.width > 0, sourceSize.height > 0,
      rect.width > 0, rect.height > 0
    else {
      return rect
    }
    let sourceAspectRatio = sourceSize.width / sourceSize.height
    let rectAspectRatio = rect.width / rect.height

    if abs(sourceAspectRatio - rectAspectRatio) < 0.001 {
      return rect  // Aspect ratios are essentially equal
    }

    if rectAspectRatio > sourceAspectRatio {
      // Rect is wider - adjust width
      let adjustedWidth = rect.height * sourceAspectRatio
      return CGRect(
        x: rect.midX - (adjustedWidth / 2),
        y: rect.origin.y,
        width: adjustedWidth,
        height: rect.height
      )
    }
    // Rect is taller - adjust height
    let adjustedHeight = rect.width / sourceAspectRatio
    return CGRect(
      x: rect.origin.x,
      y: rect.midY - (adjustedHeight / 2),
      width: rect.width,
      height: adjustedHeight
    )
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

class LinkZoomExpoView: RouterViewWithLogger {
  var module: LinkPreviewNativeModule? {
    return appContext?.moduleRegistry.get(moduleWithName: LinkPreviewNativeModule.moduleName)
      as? LinkPreviewNativeModule
  }

  var sourceRepository: LinkZoomTransitionsSourceRepository? {
    guard let module else {
      logger?.warn("[expo-router] LinkPreviewNativeModule not loaded. Make sure expo-router is properly configured.")
      return nil
    }
    return module.zoomSourceRepository
  }

  var alignmentViewRepository: LinkZoomTransitionsAlignmentViewRepository? {
    guard let module else {
      logger?.warn("[expo-router] LinkPreviewNativeModule not loaded.  Make sure expo-router is properly configured.")
      return nil
    }
    return module.zoomAlignmentViewRepository
  }
}
