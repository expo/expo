import React

func DevMenuUIEdgeInsetsEqualToEdgeInsetsWithThreshold(_ insets1: UIEdgeInsets, _ insets2: UIEdgeInsets, _ threshold: CGFloat) -> Bool {
  return abs(insets1.left - insets2.left) <= threshold &&
    abs(insets1.right - insets2.right) <= threshold &&
    abs(insets1.top - insets2.top) <= threshold &&
    abs(insets1.bottom - insets2.bottom) <= threshold
}

extension UIView {
  var nativeSafeAreaSupport: Bool {
    return responds(to: #selector(getter: safeAreaInsets))
  }

  func safeAreaInsetsOrEmulate() -> UIEdgeInsets {
    if nativeSafeAreaSupport {
      if #available(iOS 11.0, *) {
        return safeAreaInsets
      }
    }
    return emulatedSafeAreaInsets()
  }

  func emulatedSafeAreaInsets() -> UIEdgeInsets {
    guard let vc = self.reactViewController() else {
      return .zero
    }

    let topLayoutOffset = vc.topLayoutGuide.length
    let bottomLayoutOffset = vc.bottomLayoutGuide.length
    var safeArea = vc.view.bounds
    safeArea.origin.y += topLayoutOffset
    safeArea.size.height -= topLayoutOffset + bottomLayoutOffset
    let localSafeArea = vc.view.convert(safeArea, to: self)
    var safeAreaInsets = UIEdgeInsets.zero

    if localSafeArea.minY > bounds.minY {
      safeAreaInsets.top = localSafeArea.minY - bounds.minY
    }

    if localSafeArea.maxY < bounds.maxY {
      safeAreaInsets.bottom = bounds.maxY - localSafeArea.maxY
    }

    return safeAreaInsets
  }
}
