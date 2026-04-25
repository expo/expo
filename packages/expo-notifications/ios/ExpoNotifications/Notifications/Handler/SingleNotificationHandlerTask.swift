//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit

public protocol SingleNotificationHandlerTaskDelegate: AnyObject {
  func taskDidFinish(_ task: SingleNotificationHandlerTask)
  func handleNotification(_ notification: UNNotification)
  func handleNotificationTimeout(_ notification: UNNotification)
}

public class SingleNotificationHandlerTask {
  public let identifier: String

  private let notification: UNNotification
  private var completionHandler: ((UNNotificationPresentationOptions) -> Void)?
  private let delegate: SingleNotificationHandlerTaskDelegate

  private var timer: Timer?

  public init(
    notification: UNNotification,
    completionHandler: @escaping (UNNotificationPresentationOptions) -> Void,
    delegate: SingleNotificationHandlerTaskDelegate
  ) {
    self.identifier = notification.request.identifier
    self.delegate = delegate
    self.notification = notification
    self.completionHandler = completionHandler
  }

  public func start() {
    delegate.handleNotification(notification)
    timer = Timer.scheduledTimer(timeInterval: 3, target: self, selector: #selector(timeout), userInfo: nil, repeats: false)
  }

  @objc
  public func timeout() {
    delegate.handleNotificationTimeout(notification)
    finish()
  }

  public func processNotificationWithOptions(_ options: UNNotificationPresentationOptions) -> Bool {
    if let completionHandler = completionHandler {
      // The completion handler must be invoked on the main thread. iOS delivers
      // `userNotificationCenter(_:willPresent:withCompletionHandler:)` on the main
      // thread, but `handleNotificationAsync` (the JS reply) is dispatched on
      // expo-modules-core's `expo.modules.AsyncFunctionQueue` worker. On iOS 16
      // the foreground-presentation pipeline (UIWindowScene/BSAction) asserts
      // main-thread, so calling the handler from the worker trips a BaseBoard
      // precondition (SIGTRAP). iOS 17+ relaxed this assertion.
      DispatchQueue.main.async {
        completionHandler(options)
      }
      finish()
      return true
    }
    finish()
    return false
  }

  public func finish() {
    timer?.invalidate()
    self.completionHandler = nil
    delegate.taskDidFinish(self)
  }
}
