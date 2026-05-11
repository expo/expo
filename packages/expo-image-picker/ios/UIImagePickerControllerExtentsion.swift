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

  internal func applyCropFix() {
    guard let cropView,
      let scrollView,
      let scrollSuperview = scrollView.superview,
      scrollView.contentSize.width > 0,
      scrollView.contentSize.height > 0 else {
      return
    }

    let cropFrame = cropView.convert(cropView.bounds, to: scrollSuperview)
    let scrollFrame = scrollView.frame
    let cropSize = cropFrame.size
    let baseWidth = scrollView.contentSize.width / scrollView.zoomScale
    let baseHeight = scrollView.contentSize.height / scrollView.zoomScale
    let minZoomForFill = max(cropSize.width / baseWidth, cropSize.height / baseHeight)
    let edgeInset = UIEdgeInsets(
      top: max(0, cropFrame.minY - scrollFrame.minY),
      left: max(0, cropFrame.minX - scrollFrame.minX),
      bottom: max(0, scrollFrame.maxY - cropFrame.maxY),
      right: max(0, scrollFrame.maxX - cropFrame.maxX)
    )

    let isInitialLayout = scrollView.contentOffset.y == 0 || scrollView.contentInset == .zero
    let needsFix = scrollView.zoomScale < minZoomForFill - 0.001

    if scrollView.isZooming || scrollView.isZoomBouncing || !(isInitialLayout || needsFix) {
      return
    }

    UIView.performWithoutAnimation {
      let previousOffset = scrollView.contentOffset
      let shouldCenterContent = scrollView.contentInset == .zero

      if scrollView.zoomScale < minZoomForFill {
        scrollView.minimumZoomScale = minZoomForFill
        scrollView.zoomScale = minZoomForFill
      }

      scrollView.contentInset = edgeInset
      if shouldCenterContent {
        scrollView.contentOffset = CGPoint(
          x: -edgeInset.left + max(0, scrollView.contentSize.width - cropSize.width) / 2,
          y: -edgeInset.top + max(0, scrollView.contentSize.height - cropSize.height) / 2
        )
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
  }

  var cropView: UIView? {
    return findCropView(from: self.view)
  }

  var scrollView: UIScrollView? {
    return findScrollView(from: self.view)
  }

  func findCropView(from view: UIView) -> UIView? {
    let shorterEdge = min(UIScreen.main.bounds.width, UIScreen.main.bounds.height)
    let size = view.bounds.size
    let tolerance = 1 / UIScreen.main.scale
    if abs(shorterEdge - size.width) <= tolerance, abs(shorterEdge - size.height) <= tolerance {
      return view
    }
    return view.subviews.lazy.compactMap { self.findCropView(from: $0) }.first
  }

  func findScrollView(from view: UIView) -> UIScrollView? {
    if let scrollView = view as? UIScrollView {
      return scrollView
    }
    return view.subviews.lazy.compactMap { self.findScrollView(from: $0) }.first
  }
}

private final class CropFixDriver: NSObject {
  private weak var picker: UIImagePickerController?
  private var displayLink: CADisplayLink?

  init(picker: UIImagePickerController) {
    self.picker = picker
    super.init()
    let link = CADisplayLink(target: self, selector: #selector(tick))
    link.add(to: .main, forMode: .common)
    self.displayLink = link
  }

  deinit {
    displayLink?.invalidate()
  }

  @objc private func tick() {
    picker?.applyCropFix()
  }
}
