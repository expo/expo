// Copyright 2021-present 650 Industries. All rights reserved.

import Foundation

typealias LoggerTimerStopBlock = () -> Double

/**
 An instance of a timer.
 */
public class LoggerTimer {
  private let stopBlock: LoggerTimerStopBlock

  internal required init(stopBlock: @escaping LoggerTimerStopBlock) {
    self.stopBlock = stopBlock
  }
  /**
   End the timer and log a timer entry. Returns the duration in milliseconds.
   */
  public func stop() -> Double {
    return self.stopBlock()
  }
}
