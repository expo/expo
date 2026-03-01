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
      completionHandler(options)
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
