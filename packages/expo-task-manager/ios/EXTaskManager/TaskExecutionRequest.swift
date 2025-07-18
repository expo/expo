// Copyright 2018-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

@objc(EXTaskExecutionRequest)
public class TaskExecutionRequest: NSObject {
    @objc public var callback: (([Any]) -> Void)?
    private var tasks: NSMutableSet
    private var results: NSMutableArray

    @objc public init(callback: @escaping ([Any]) -> Void) {
        self.callback = callback
        self.tasks = NSMutableSet()
        self.results = NSMutableArray()
        super.init()
    }

    @objc public func addTask(_ task: EXTaskInterface) {
        tasks.add(task)
    }

    @objc public func task(_ task: EXTaskInterface, didFinishWithResult result: Any) {
        tasks.remove(task)
        results.add(result)
        maybeEvaluate()
    }

    @objc public func isIncludingTask(_ task: EXTaskInterface?) -> Bool {
        guard let task = task else { return false }
        return tasks.contains(task)
    }

    @objc public func maybeEvaluate() {
      if let callback = callback {
          // Make a strong reference before executing callback
          let strongSelf = self
          callback(results as! [Any])
          self.callback = nil
          tasks.removeAllObjects()
          results.removeAllObjects()
          _ = strongSelf // Keep reference until end
      }
    }
}
