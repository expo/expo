import SwiftUI
import ExpoModulesCore

@objc public class DevLauncherViewController: UIViewController {
  private var hostingController: UIHostingController<DevLauncherRootView>?
  var viewModel = DevLauncherViewModel()
#if !os(macOS)
  private let cornerMeasuringView = UIView()
  private let contentHorizontalPadding: CGFloat = 16
#endif

  public override func viewDidLoad() {
    super.viewDidLoad()
    addHostingController()
  }

#if !os(macOS)
  public override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    updateDisplayCornerInsets()
    updateTopSafeAreaInset()
  }

  /// The system safe area does not include rounded display corners. For each corner, add the inset that
  /// keeps content on or inside the display's arc. A corner already inside an inset region adds nothing.
  private func updateDisplayCornerInsets() {
    guard #available(iOS 26.0, *) else {
      return
    }

    if cornerMeasuringView.superview == nil {
      cornerMeasuringView.isUserInteractionEnabled = false
      cornerMeasuringView.cornerConfiguration = .corners(radius: .containerConcentric(minimum: 0))
      view.insertSubview(cornerMeasuringView, at: 0)
    }
    cornerMeasuringView.frame = view.bounds

    let applied = additionalSafeAreaInsets
    let safe = view.safeAreaInsets
    let systemSafe = UIEdgeInsets(
      top: safe.top - applied.top,
      left: safe.left - applied.left,
      bottom: safe.bottom - applied.bottom,
      right: safe.right - applied.right
    )

    // A content corner at (t, t) from the display corner lies inside an arc of radius r when t >= r * (1 - 1/sqrt(2)).
    func neededInsets(corner: UIRectCorner, horizontalSafe: CGFloat, verticalSafe: CGFloat) -> (horizontal: CGFloat, vertical: CGFloat) {
      let radius = cornerMeasuringView.effectiveRadius(corner: corner)
      let offset = radius * (1 - 0.5.squareRoot())
      return (
        horizontal: max(0, offset - horizontalSafe - contentHorizontalPadding),
        vertical: max(0, offset - verticalSafe)
      )
    }

    let topLeft = neededInsets(corner: .topLeft, horizontalSafe: systemSafe.left, verticalSafe: systemSafe.top)
    let topRight = neededInsets(corner: .topRight, horizontalSafe: systemSafe.right, verticalSafe: systemSafe.top)
    let bottomLeft = neededInsets(corner: .bottomLeft, horizontalSafe: systemSafe.left, verticalSafe: systemSafe.bottom)
    let bottomRight = neededInsets(corner: .bottomRight, horizontalSafe: systemSafe.right, verticalSafe: systemSafe.bottom)

    let insets = UIEdgeInsets(
      top: max(topLeft.vertical, topRight.vertical).rounded(.up),
      left: max(topLeft.horizontal, bottomLeft.horizontal).rounded(.up),
      bottom: max(bottomLeft.vertical, bottomRight.vertical).rounded(.up),
      right: max(topRight.horizontal, bottomRight.horizontal).rounded(.up)
    )
    if insets != applied {
      additionalSafeAreaInsets = insets
    }
  }

  private func updateTopSafeAreaInset() {
    let hostingViewInset = (hostingController?.view.safeAreaInsets.top ?? 0) - additionalSafeAreaInsets.top
    let windowInset = view.window?.safeAreaInsets.top ?? 0
    let newInset: CGFloat = hostingViewInset > 0 ? 0 : windowInset

    if newInset != viewModel.topSafeAreaInset {
      viewModel.topSafeAreaInset = newInset
    }
  }
#endif

  private func setupViewController() {
    view.backgroundColor = UIColor.white

    let rootView = DevLauncherRootView(viewModel: viewModel)
    hostingController = UIHostingController(rootView: rootView)
    hostingController?.view.backgroundColor = UIColor.clear
#if os(macOS)
    hostingController?.view.appearance = NSAppearance(named: .aqua)
#endif
  }

  @objc public func resetHostingController() {
#if !os(macOS)
    if let hostingController {
      hostingController.willMove(toParent: nil)
      hostingController.view.removeFromSuperview()
      hostingController.removeFromParent()
    }
#endif
    hostingController = nil
    if isViewLoaded {
      addHostingController()
    }
  }

  private func addHostingController() {
    if hostingController == nil {
      setupViewController()
    }

    guard let hostingController else {
      return
    }

    addChild(hostingController)
    hostingController.view.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(hostingController.view)

    NSLayoutConstraint.activate([
      hostingController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      hostingController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      hostingController.view.topAnchor.constraint(equalTo: view.topAnchor),
      hostingController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
    ])

#if !os(macOS)
    navigationController?.setNavigationBarHidden(true, animated: false)
    hostingController.didMove(toParent: self)
#endif
  }
}
