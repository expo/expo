// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
class EXDevLauncherErrorNavigationController: UINavigationController {
  private weak var manager: EXDevLauncherErrorManager?

  override func viewDidLoad() {
    super.viewDidLoad()
    // We could use segue to init the root view controller
    // but it doesn't work - the action custom init block isn't triggered at all.
    let topVC = self.topViewController as? EXDevLauncherErrorViewController
    topVC?.manager = manager
  }
  
  @objc
  public static func create(forManager manager: EXDevLauncherErrorManager) -> EXDevLauncherErrorNavigationController? {
    guard let bundle = EXDevLauncherUtils.resourcesBundle() else {
      return nil
    }

    let storyboard = UIStoryboard(name: "EXDevLauncherErrorView", bundle: bundle)
    let vc = storyboard.instantiateViewController(withIdentifier: "EXDevLauncherErrorView") as? EXDevLauncherErrorNavigationController
    
    vc?.manager = manager
    return vc
  }
}
