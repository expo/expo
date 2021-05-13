// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public class EXDevLauncherErrorViewController: UIViewController {
  internal weak var manager: EXDevLauncherErrorManager?
  
  public override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
    if segue.identifier == "createLogView" {
      let logView = segue.destination as? EXDevLauncherErrorLogViewController
      logView?.manager = manager
    }
  }
  
  @IBSegueAction func createLogView(_ coder: NSCoder) -> EXDevLauncherErrorLogViewController? {
    let logView = EXDevLauncherErrorLogViewController(coder: coder)
    logView?.manager = manager
    return logView
  }
  
  @IBAction func onReload(_ sender: UIButton) {
    sender.isEnabled = false
    manager?.clearErros()
    guard let appUrl = manager?.controller?.sourceUrl() else {
      // We don't have app url. So we fallback to launcher.
      // Shoudn't happen.
      navigateToLauncher()
      return
    }
    
    manager?.controller?.loadApp(appUrl, onSuccess: nil, onError: { [weak self] (error) in
      self?.navigateToLauncher()
    })
  }
  
  @IBAction func onBackToLauncher(_ sender: UIButton) {
    sender.isEnabled = false
    manager?.clearErros()
    navigateToLauncher()
  }
  
  public override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
    self.navigationController?.setNavigationBarHidden(true, animated: animated)
  }
  
  
  private func navigateToLauncher() {
    manager?.controller?.navigateToLauncher()
  }
}
