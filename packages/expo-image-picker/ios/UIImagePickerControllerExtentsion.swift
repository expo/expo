// Copyright 2016-present 650 Industries. All rights reserved.

extension UIImagePickerController {
  func fixCannotMoveEditingBox() {
    if let cropView = cropView,
      let scrollView = scrollView,
      scrollView.contentOffset.y == 0 {
      let top = cropView.frame.minY + self.view.safeAreaInsets.top
      let bottom = scrollView.frame.height - cropView.frame.height - top
      scrollView.contentInset = UIEdgeInsets(top: top, left: 0, bottom: bottom, right: 0)

      var offset: CGFloat = 0
      if scrollView.contentSize.height > scrollView.contentSize.width {
        offset = 0.5 * (scrollView.contentSize.height - scrollView.contentSize.width)
      }
      scrollView.contentOffset = CGPoint(x: 0, y: -top + offset)
    }

    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
      self?.fixCannotMoveEditingBox()
    }
  }

  var cropView: UIView? {
    return findCropView(from: self.view)
  }

  var scrollView: UIScrollView? {
    return findScrollView(from: self.view)
  }

  func findCropView(from view: UIView) -> UIView? {
    let width = UIScreen.main.bounds.width
    let size = view.bounds.size
    if width == size.height, width == size.height {
      return view
    }
    for view in view.subviews {
      if let cropView = findCropView(from: view) {
        return cropView
      }
    }
    return nil
  }

  func findScrollView(from view: UIView) -> UIScrollView? {
    if let scrollView = view as? UIScrollView {
      return scrollView
    }
    for view in view.subviews {
      if let scrollView = findScrollView(from: view) {
        return scrollView
      }
    }
    return nil
  }
}
