// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public class EXDevLauncherErrorViewController: UIViewController, UITableViewDataSource {
  internal weak var manager: EXDevLauncherErrorManager?
  var error: EXDevLauncherAppError?

  @IBOutlet weak var errorInformation: UILabel!
  @IBOutlet weak var errorStack: UITableView!

  @IBAction func reload(_ sender: Any) {
    guard let appUrl = manager?.controller?.appManifestURLWithFallback() else {
      // We don't have app url. So we fallback to launcher.
      // Shoudn't happen.
      navigateToLauncher()
      return
    }

    manager?.controller?.loadApp(appUrl, onSuccess: nil, onError: { [weak self] _ in
      self?.navigateToLauncher()
    })
  }

  @IBAction func goToHome(_ sender: Any) {
    navigateToLauncher()
  }

  public override func viewDidLoad() {
    error = manager?.consumeError()

    errorInformation.text = error?.message ?? "Unknown error"
    errorStack?.dataSource = self
  }

  public func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
    return error?.stack?.count ?? 0
  }

  public func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = tableView.dequeueReusableCell(withIdentifier: "cell", for: indexPath) as! EXDevLauncherStackTrace
    let frame = error!.stack![indexPath.item]
    cell.function.text = frame.methodName
    cell.file.text = frame.file
    return cell
  }

  @objc
  public static func create(forManager manager: EXDevLauncherErrorManager) -> EXDevLauncherErrorViewController? {
    guard let bundle = EXDevLauncherUtils.resourcesBundle() else {
      return nil
    }

    let storyboard = UIStoryboard(name: "EXDevLauncherErrorView", bundle: bundle)
    let vc = storyboard.instantiateViewController(withIdentifier: "EXDevLauncherErrorView") as? EXDevLauncherErrorViewController

    vc?.manager = manager
    return vc
  }

  private func navigateToLauncher() {
    RCTExecuteOnMainQueue { [self]
      self.manager?.controller?.navigateToLauncher()
    }
  }
}
