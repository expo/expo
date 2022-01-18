// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public class EXDevLauncherRedBoxInterceptor: NSObject {
  @objc static let customRedBox = EXDevLauncherRedBox()

  @objc
  public static var isInstalled: Bool = false {
    willSet {
      if isInstalled != newValue {
        swizzle()
      }
    }
  }

  static private func swizzle() {
    EXDevLauncherUtils.swizzle(
      selector: #selector(RCTCxxBridge.module(forName:)),
      withSelector: #selector(RCTCxxBridge.EXDevLauncher_module(forName:)),
      forClass: RCTCxxBridge.self
    )

    EXDevLauncherUtils.swizzle(
      selector: #selector(RCTCxxBridge.module(forName:lazilyLoadIfNecessary:)),
      withSelector: #selector(RCTCxxBridge.EXDevLauncher_module(forName:lazilyLoadIfNecessary:)),
      forClass: RCTCxxBridge.self
    )

    EXDevLauncherUtils.swizzle(
      selector: #selector(RCTCxxBridge.module(for:)),
      withSelector: #selector(RCTCxxBridge.EXDevLauncher_module(forClass:)),
      forClass: RCTCxxBridge.self
    )
  }
}

extension RCTCxxBridge {
  @objc
  func EXDevLauncher_module(forName name: String) -> Any? {
    let orginalModule = self.EXDevLauncher_module(forName: name)
    return replaceRedBox(orginalModule)
  }

  @objc
  func EXDevLauncher_module(forName name: String, lazilyLoadIfNecessary lazilyLoad: Bool) -> Any? {
    let orginalModule = self.EXDevLauncher_module(forName: name, lazilyLoadIfNecessary: lazilyLoad)
    return replaceRedBox(orginalModule)
  }

  @objc
  func EXDevLauncher_module(forClass clazz: Any) -> Any? {
    let orginalModule = self.EXDevLauncher_module(forClass: clazz)
    return replaceRedBox(orginalModule)
  }

  @objc
  private func replaceRedBox(_ module: Any?) -> Any? {
    if module is RCTRedBox {
      let logBox = EXDevLauncher_module(forClass: RCTLogBox.self) as? RCTLogBox
      let customRedBox = EXDevLauncherRedBoxInterceptor.customRedBox
      customRedBox.register(logBox)
      return customRedBox.unsafe_castToRCTRedBox()
    }

    return module
  }
}
