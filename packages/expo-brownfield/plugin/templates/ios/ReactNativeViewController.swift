import UIKit

@objc
public class ReactNativeViewController: UIViewController {
  private let moduleName: String
  private let initialProps: [AnyHashable: Any]?
  private let launchOptions: [AnyHashable: Any]?

  @objc
  public init(
    moduleName: String,
    initialProps: [AnyHashable: Any]? = nil,
    launchOptions: [AnyHashable: Any]? = nil
  ) {
    self.moduleName = moduleName
    self.initialProps = initialProps
    self.launchOptions = launchOptions
    super.init(nibName: nil, bundle: nil)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  override public func viewDidLoad() {
    super.viewDidLoad()

    do {
      self.view = try ReactNativeHostManager.shared.loadView(
        moduleName: moduleName,
        initialProps: initialProps,
        launchOptions: launchOptions
      )
    } catch {
      print("Error loading React Native view: \(error)")
      print(
        "Please make sure ReactNativeHostManager.shared.initialize() has been called prior to using the view controller"
      )
    }

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(popToNative(_:)),
      name: NSNotification.Name("popToNative"),
      object: nil
    )

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(setNativeBackEnabled(_:)),
      name: NSNotification.Name("setNativeBackEnabled"),
      object: nil
    )
  }

  @objc
  private func popToNative(_ notification: Notification) {
    let animated = notification.userInfo?["animated"] as? Bool ?? false
    DispatchQueue.main.async { [weak self] in
      self?.navigationController?.popViewController(animated: animated)
    }
  }

  @objc
  private func setNativeBackEnabled(_ notification: Notification) {
    guard let enabled = notification.userInfo?["enabled"] as? Bool else {
      return
    }

    DispatchQueue.main.async { [weak self] in
      self?.navigationController?.interactivePopGestureRecognizer?.isEnabled = enabled
      self?.navigationController?.view?.gestureRecognizers?.forEach { gesture in
        if gesture === self?.navigationController?.interactivePopGestureRecognizer {
          return
        }

        if gesture is UIScreenEdgePanGestureRecognizer
          || gesture is UIPanGestureRecognizer {
          gesture.isEnabled = enabled
        }
      }
    }
  }
}
