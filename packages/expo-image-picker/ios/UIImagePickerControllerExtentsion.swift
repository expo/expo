// Copyright 2016-present 650 Industries. All rights reserved.

extension UIImagePickerController {
  func fixCannotMoveEditingBox(contentFit: ContentFit = .fill) {
    defer {
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.01) { [weak self] in
        self?.fixCannotMoveEditingBox(contentFit: contentFit)
      }
    }

    guard let cropView = cropView,
      let scrollView = scrollView,
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
    let minZoomForContain = min(cropSize.width / baseWidth, cropSize.height / baseHeight)
    let isContain = contentFit == .contain
    let edgeInset = UIEdgeInsets(
      top: max(0, cropFrame.minY - scrollFrame.minY),
      left: max(0, cropFrame.minX - scrollFrame.minX),
      bottom: max(0, scrollFrame.maxY - cropFrame.maxY),
      right: max(0, scrollFrame.maxX - cropFrame.maxX)
    )

    func targetInset(for contentSize: CGSize) -> UIEdgeInsets {
      guard isContain else {
        return edgeInset
      }

      let extraX = max(0, (cropSize.width - contentSize.width) / 2)
      let extraY = max(0, (cropSize.height - contentSize.height) / 2)
      return UIEdgeInsets(
        top: edgeInset.top + extraY,
        left: edgeInset.left + extraX,
        bottom: edgeInset.bottom + extraY,
        right: edgeInset.right + extraX
      )
    }

    let isInitialLayout = scrollView.contentOffset.y == 0 || scrollView.contentInset == .zero
    let inset = targetInset(for: scrollView.contentSize)
    let insetDelta = max(
      max(abs(scrollView.contentInset.top - inset.top), abs(scrollView.contentInset.left - inset.left)),
      max(abs(scrollView.contentInset.bottom - inset.bottom), abs(scrollView.contentInset.right - inset.right))
    )
    let insetTolerance = 1 / UIScreen.main.scale
    let needsMinimumZoomFix = abs(scrollView.minimumZoomScale - minZoomForContain) > 0.001
    let centeredOffset = CGPoint(
      x: -inset.left + max(0, scrollView.contentSize.width - cropSize.width) / 2,
      y: -inset.top + max(0, scrollView.contentSize.height - cropSize.height) / 2
    )
    let offsetDelta = max(
      abs(scrollView.contentOffset.x - centeredOffset.x),
      abs(scrollView.contentOffset.y - centeredOffset.y)
    )
    let isAtContainMinimum = isContain && scrollView.zoomScale <= minZoomForContain + 0.001
    let needsCenteringAtMinimum = isAtContainMinimum && offsetDelta > insetTolerance
    let needsFix = isContain
      ? insetDelta > insetTolerance || needsMinimumZoomFix || needsCenteringAtMinimum
      : scrollView.zoomScale < minZoomForFill - 0.001

    if scrollView.isZooming || scrollView.isZoomBouncing || !(isInitialLayout || needsFix) {
      return
    }

    UIView.performWithoutAnimation {
      let previousOffset = scrollView.contentOffset
      let shouldZoomToContain = isContain
        && (isInitialLayout || needsMinimumZoomFix)
        && scrollView.zoomScale > minZoomForContain
      let shouldCenterContent = scrollView.contentInset == .zero
        || shouldZoomToContain
        || needsCenteringAtMinimum

      if isContain {
        scrollView.minimumZoomScale = minZoomForContain
        if shouldZoomToContain {
          scrollView.zoomScale = minZoomForContain
        }
      } else if scrollView.zoomScale < minZoomForFill {
        scrollView.minimumZoomScale = minZoomForFill
        scrollView.zoomScale = minZoomForFill
      }

      let adjustedInset = targetInset(for: scrollView.contentSize)
      scrollView.contentInset = adjustedInset
      if shouldCenterContent {
        scrollView.contentOffset = CGPoint(
          x: -adjustedInset.left + max(0, scrollView.contentSize.width - cropSize.width) / 2,
          y: -adjustedInset.top + max(0, scrollView.contentSize.height - cropSize.height) / 2
        )
      } else {
        let minOffset = CGPoint(x: -adjustedInset.left, y: -adjustedInset.top)
        let maxOffset = CGPoint(
          x: max(minOffset.x, scrollView.contentSize.width - scrollView.bounds.width + adjustedInset.right),
          y: max(minOffset.y, scrollView.contentSize.height - scrollView.bounds.height + adjustedInset.bottom)
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
