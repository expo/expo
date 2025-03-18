//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit

let shouldShowAlertKey = "shouldShowAlert"
let shouldPlaySoundKey = "shouldPlaySound"
let shouldSetBadgeKey = "shouldSetBadge"

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

  public func handleResponse(_ behavior: [String: Any]) -> Bool {
    if let completionHandler = completionHandler {
      completionHandler(presentationOptions(behavior))
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

  func presentationOptions(_ behavior: [String: Any]) -> UNNotificationPresentationOptions {
    var options: UNNotificationPresentationOptions = []

    /*
    if let shouldShowAlert = behavior[shouldShowAlertKey] as? Bool, shouldShowAlert {
      options.insert(.alert)
    }
     */

    if let shouldPlaySound = behavior[shouldPlaySoundKey] as? Bool, shouldPlaySound {
      options.insert(.sound)
    }

    if let shouldSetBadge = behavior[shouldSetBadgeKey] as? Bool, shouldSetBadge {
      options.insert(.badge)
    }

    // TODO(iOS 14): use UNNotificationPresentationOptionList and UNNotificationPresentationOptionBanner

    return options
  }
}
