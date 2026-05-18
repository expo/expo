// Phase 1 bootstrap. Goal: prove the SwiftPM dep graph for `expo` resolves and
// links without CocoaPods. No React Native host yet — that's phase 3.

import UIKit
import Expo

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    window = UIWindow(frame: UIScreen.main.bounds)

    let viewController = UIViewController()
    viewController.view.backgroundColor = .systemBackground

    let label = UILabel()
    label.text = "SwiftPM works"
    label.font = .preferredFont(forTextStyle: .title1)
    label.textAlignment = .center
    label.translatesAutoresizingMaskIntoConstraints = false
    viewController.view.addSubview(label)
    NSLayoutConstraint.activate([
      label.centerXAnchor.constraint(equalTo: viewController.view.centerXAnchor),
      label.centerYAnchor.constraint(equalTo: viewController.view.centerYAnchor),
    ])

    window?.rootViewController = viewController
    window?.makeKeyAndVisible()
    return true
  }
}
