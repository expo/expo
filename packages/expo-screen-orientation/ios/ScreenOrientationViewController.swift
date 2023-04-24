import ExpoModulesCore
import EXScreenOrientation

let defaultScreenOrientationMask = "EXDefaultScreenOrientationMask"

// copy of RNScreens protocol
protocol ScreenOrientationRNSScreenWindowTraits {
  static func shouldAskScreensForScreenOrientation(_ inViewController: UIViewController) -> Bool
}

class ScreenOrientationViewController: UIViewController {
  let screenOrientationRegistry = ScreenOrientationRegistry.shared
  private var defaultOrientationMask: UIInterfaceOrientationMask

  init(defaultOrientationMask: UIInterfaceOrientationMask = .portrait) {
    self.defaultOrientationMask = defaultOrientationMask
    super.init(nibName: nil, bundle: nil)
  }

  convenience init(defaultScreenOrientationFromPlist: Void) {
    let plistValue = Bundle.main.object(forInfoDictionaryKey: defaultScreenOrientationMask) as? String
    let mask = (try? plistValue?.toUIInterfaceOrientationMask()) ?? .portrait
    self.init(defaultOrientationMask: mask)
  }

  @available(*, unavailable)
  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  // This requires the UIViewControllerBasedStatusBarAppearance to be set to true. RNScreens might cause this setting to fail anyways.
  override var prefersStatusBarHidden: Bool {
    return screenOrientationRegistry.prefersStatusBarHidden
  }

  override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
    guard !shouldUseRNScreenOrientation() else {
      return super.supportedInterfaceOrientations
    }
    let mask = screenOrientationRegistry.requiredOrientationMask()
    return !mask.isEmpty ? mask : defaultOrientationMask
  }

  override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
    super.traitCollectionDidChange(previousTraitCollection)

    if traitCollection.verticalSizeClass != previousTraitCollection?.verticalSizeClass ||
      traitCollection.horizontalSizeClass != previousTraitCollection?.horizontalSizeClass {
      screenOrientationRegistry.traitCollectionDidChange(to: traitCollection)
    }
  }

  private func shouldUseRNScreenOrientation() -> Bool {
    guard let screenWindowTraitsClass = NSClassFromString("RNSScreenWindowTraits"),
      let screenWindowTraits = screenWindowTraitsClass as? ScreenOrientationRNSScreenWindowTraits.Type else {
      return false
    }
    return screenWindowTraits.shouldAskScreensForScreenOrientation(self)
  }
}
