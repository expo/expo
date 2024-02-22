// Copyright 2021-present 650 Industries. All rights reserved.

import Foundation

typealias LoggerTimerStopBlock = () -> Void

/**
 An instance of a timer.
 */
public class LoggerTimer {
  private let stopBlock: LoggerTimerStopBlock

  internal required init(stopBlock: @escaping LoggerTimerStopBlock) {
    self.stopBlock = stopBlock
  }
  /**
   End the timer and log a timer entry.
   */
  public func stop() {
    self.stopBlock()
  }
}
