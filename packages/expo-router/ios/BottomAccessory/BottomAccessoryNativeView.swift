import ExpoModulesCore

class BottomAccessoryNativeView: ExpoView {
  private class AccessoryContentView: UIView {
    var onSizeChange: (CGSize) -> Void = { _ in
      // Do nothing by default
    }

    var displayLink: CADisplayLink?
    var lastSize: CGSize = .zero

    override func didMoveToWindow() {
      super.didMoveToWindow()
      if window != nil {
        displayLink = CADisplayLink(target: self, selector: #selector(checkSize))
        displayLink?.add(to: .main, forMode: .common)
      } else {
        displayLink?.invalidate()
        displayLink = nil
      }
    }

    @objc func checkSize() {
      // Using presentation layer, because bounds are not updated during animation
      guard let presentationLayer = layer.presentation() else { return }
      let currentSize = presentationLayer.bounds.size
      if currentSize != lastSize {
        lastSize = currentSize
        print(currentSize)
        onSizeChange(currentSize)
      }
    }

    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
      super.traitCollectionDidChange(previousTraitCollection)

      // Developers can handle UITabAccessoryEnvironment here
      if #available(iOS 26.0, *) {
        let env = self.traitCollection.tabAccessoryEnvironment

        if env == .inline {
          //                  print("Inline mode")
        } else if env == .regular {
          //                  print("Regular mode")
        } else {
          //                  print("Unspecified")
        }
      }
    }
  }
  private var content = AccessoryContentView()
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    self.content.onSizeChange = { size in
      #if RCT_NEW_ARCH_ENABLED
      self.setViewSize(
        CGSize(width: size.width, height: size.height))
      #endif
    }
  }

  var parentTabBarController: UITabBarController? {
    var responder: UIResponder? = self
    while let r = responder {
      print("responder: \(r)")
      if let viewController = r as? UITabBarController {
        return viewController
      }
      responder = r.next
    }
    return nil
  }

  override func didMoveToSuperview() {
    super.didMoveToSuperview()

    print(self.parentTabBarController)

    if let tabBarController = self.parentTabBarController {
      print("Found tab bar controller:", tabBarController)
      if #available(iOS 26, *) {
        assert(
          tabBarController.bottomAccessory == nil,
          "[expo-router] there can be only one bottom accessory mounted for each tab bar")
        let accessory = UITabAccessory(contentView: content)
        NSLayoutConstraint.activate([
          content.topAnchor.constraint(equalTo: accessory.contentView.topAnchor),
          content.bottomAnchor.constraint(equalTo: accessory.contentView.bottomAnchor),
          content.leadingAnchor.constraint(equalTo: accessory.contentView.leadingAnchor),
          content.trailingAnchor.constraint(
            equalTo: accessory.contentView.trailingAnchor)
        ])
        tabBarController.bottomAccessory = accessory
      }
    }
  }
  // MARK: - Children
  #if RCT_NEW_ARCH_ENABLED
    override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
      self.content.addSubview(childComponentView)
    }

    override func unmountChildComponentView(_ child: UIView, index: Int) {
      child.removeFromSuperview()
    }
  #endif
}
