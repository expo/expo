// Copyright 2016-present 650 Industries. All rights reserved.

import ObjectiveC.runtime

private var cropFixDriverKey: UInt8 = 0

extension UIImagePickerController {
  // Attaches a `CADisplayLink` to the picker that calls `applyCropFix` on
  // every screen refresh while the picker is alive. UIImagePickerController
  // exposes no callback for "the editor mounted" or "the image loaded," and
  // its internal scroll view is rebuilt at points we can't observe, so we
  // re-run the fix per frame until the picker deallocates.
  func fixCannotMoveEditingBox() {
    if objc_getAssociatedObject(self, &cropFixDriverKey) == nil {
      objc_setAssociatedObject(
        self,
        &cropFixDriverKey,
        CropFixDriver(picker: self),
        .OBJC_ASSOCIATION_RETAIN_NONATOMIC
      )
    }
  }

  internal func applyCropFix(cropView: UIView, scrollView: UIScrollView, isFirstApply: Bool) -> Bool {
    guard scrollView.contentSize.width > 0,
      scrollView.contentSize.height > 0,
      let scrollSuperview = scrollView.superview else {
      return false
    }

    let cropFrame = cropView.convert(cropView.bounds, to: scrollSuperview)
    let scrollFrame = scrollView.frame
    let cropSide = min(cropFrame.width, cropFrame.height)
    let baseWidth = scrollView.contentSize.width / scrollView.zoomScale
    let baseHeight = scrollView.contentSize.height / scrollView.zoomScale
    let imageShortSide = min(baseWidth, baseHeight)
    guard imageShortSide > 0 else {
      return false
    }

    let minZoomForFill = cropSide / imageShortSide
    let needsFix = scrollView.zoomScale < minZoomForFill - 0.001
    let needsMinimumZoomUpdate = abs(scrollView.minimumZoomScale - minZoomForFill) > 0.001

    if scrollView.isZooming || scrollView.isZoomBouncing || !(isFirstApply || needsFix || needsMinimumZoomUpdate) {
      return false
    }

    let edgeInset = UIEdgeInsets(
      top: max(0, cropFrame.minY - scrollFrame.minY),
      left: max(0, cropFrame.minX - scrollFrame.minX),
      bottom: max(0, scrollFrame.maxY - cropFrame.maxY),
      right: max(0, scrollFrame.maxX - cropFrame.maxX)
    )

    UIView.performWithoutAnimation {
      let previousOffset = scrollView.contentOffset

      scrollView.minimumZoomScale = minZoomForFill
      if isFirstApply || scrollView.zoomScale < minZoomForFill {
        scrollView.zoomScale = minZoomForFill
      }

      scrollView.contentInset = edgeInset
      if isFirstApply {
        scrollView.contentOffset = CGPoint(
          x: -edgeInset.left + max(0, scrollView.contentSize.width - cropSide) / 2,
          y: -edgeInset.top + max(0, scrollView.contentSize.height - cropSide) / 2
        )
        scrollView.layoutIfNeeded()
      } else {
        let minOffset = CGPoint(x: -edgeInset.left, y: -edgeInset.top)
        let maxOffset = CGPoint(
          x: max(minOffset.x, scrollView.contentSize.width - scrollView.bounds.width + edgeInset.right),
          y: max(minOffset.y, scrollView.contentSize.height - scrollView.bounds.height + edgeInset.bottom)
        )
        scrollView.contentOffset = CGPoint(
          x: min(max(previousOffset.x, minOffset.x), maxOffset.x),
          y: min(max(previousOffset.y, minOffset.y), maxOffset.y)
        )
      }
    }
    return true
  }

  var scrollView: UIScrollView? {
    return findView(named: "PLImageScrollView", from: view) as? UIScrollView
  }

  var cropView: UIView? {
    return findView(named: "PLCropOverlayCropView", from: view)?
      .subviews
      .first(where: { $0.bounds.isSquare })
  }

  private func findView(named className: String, from view: UIView) -> UIView? {
    if NSStringFromClass(type(of: view)) == className {
      return view
    }
    return view.subviews.lazy.compactMap { self.findView(named: className, from: $0) }.first
  }
}

private final class CropFixDriverProxy: NSObject {
  weak var driver: CropFixDriver?

  init(_ driver: CropFixDriver) {
    self.driver = driver
  }

  @objc func tick() {
    driver?.tick()
  }
}

private final class CropFixDriver: NSObject {
  private weak var picker: UIImagePickerController?
  private var displayLink: CADisplayLink?
  private weak var cachedScrollView: UIScrollView?
  private var cachedCropFrame = CGRect.null
  private var hasBeenApplied = false

  init(picker: UIImagePickerController) {
    self.picker = picker
    super.init()
    let proxy = CropFixDriverProxy(self)
    let link = CADisplayLink(target: proxy, selector: #selector(CropFixDriverProxy.tick))
    link.add(to: .main, forMode: .common)
    self.displayLink = link
  }

  deinit {
    displayLink?.invalidate()
  }

  fileprivate func tick() {
    guard let picker = picker else {
      return
    }

    guard let scrollView = picker.scrollView,
      let scrollSuperview = scrollView.superview,
      let cropView = picker.cropView else {
      cachedScrollView = nil
      cachedCropFrame = .null
      hasBeenApplied = false
      return
    }

    let cropFrame = cropView.convert(cropView.bounds, to: scrollSuperview)
    if cachedScrollView !== scrollView ||
      !cachedCropFrame.isApproximatelyEqual(to: cropFrame) {
      cachedScrollView = scrollView
      cachedCropFrame = cropFrame
      hasBeenApplied = false
    }

    if picker.applyCropFix(cropView: cropView, scrollView: scrollView, isFirstApply: !hasBeenApplied) {
      hasBeenApplied = true
    }
  }
}

private extension CGRect {
  var isSquare: Bool {
    let tolerance = 2 / UIScreen.main.scale
    return width >= 44 && abs(width - height) <= tolerance
  }

  func isApproximatelyEqual(to other: CGRect, tolerance: CGFloat = 1) -> Bool {
    return abs(origin.x - other.origin.x) <= tolerance &&
      abs(origin.y - other.origin.y) <= tolerance &&
      abs(size.width - other.size.width) <= tolerance &&
      abs(size.height - other.size.height) <= tolerance
  }
}
