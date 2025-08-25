import ExpoModulesCore

class BottomAccessoryNativeView: ExpoView {
  private class AccessoryContentView: UIView {
    var onSizeChange: () -> Void = {}

    override func layoutSubviews() {
      super.layoutSubviews()
      self.onSizeChange()
    }
  }
  private var content = AccessoryContentView()
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    self.content.onSizeChange = {
      #if RCT_NEW_ARCH_ENABLED
        self.setViewSize(
          CGSize(width: self.content.bounds.width, height: self.content.bounds.height))
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
            equalTo: accessory.contentView.trailingAnchor),
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
