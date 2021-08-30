// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public protocol EXDevLauncherErrorManagerListener {
  func onNewError()
}

@objc
public class EXDevLauncherErrorManager: NSObject {
  internal weak var controller: EXDevLauncherController?
  private weak var currentVC: EXDevLauncherErrorNavigationController?
  private var errors: [String] = []
  private var errorListeners: [EXDevLauncherErrorManagerListener] = []
  
  @objc
  public init(controller: EXDevLauncherController) {
    self.controller = controller
    EXDevLauncherRedBoxInterceptor.isInstalled = true
  }
  
  @objc
  public func addOnNewErrorListener(_ listener: EXDevLauncherErrorManagerListener) {
    errorListeners.append(listener)
  }
  
  @objc
  public func removeOnNewErrorListener(_ listener: EXDevLauncherErrorManagerListener) {
    guard let index = errorListeners.firstIndex(where: { $0 === listener }) else {
      return
    }
    
    errorListeners.remove(at: index)
   }
  
  @objc
  public func clearErros() {
    errors.removeAll()
  }
  
  @objc
  public func getErrors() -> [String] {
    return errors
  }
  
  @objc
  public func showError(message: String, stack: [RCTJSStackFrame]?) {
    addError(message)
    
    guard let nextViewController = getNextErrorViewController() else {
      currentVC = nil
      return
    }
    
    currentVC = nextViewController
    controller?.currentWindow()?.rootViewController = currentVC
  }
  
  private func addError(_ message: String) {
    errors.append(message)
  }
  
  private func getNextErrorViewController() -> EXDevLauncherErrorNavigationController? {
    if currentVC == nil || controller?.currentWindow()?.rootViewController != currentVC {
      return EXDevLauncherErrorNavigationController.create(forManager: self)
    }
    
    return currentVC
  }
}
