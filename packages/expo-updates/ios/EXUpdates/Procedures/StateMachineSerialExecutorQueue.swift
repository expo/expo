//  Copyright © 2019 650 Industries. All rights reserved.

private final class MethodInvocationHolder {
  private let procedure: StateMachineProcedure
  private let onMethodInvocationComplete: (_ invocationHolder: MethodInvocationHolder) -> Void

  init(procedure: StateMachineProcedure, onMethodInvocationComplete: @escaping (_ invocationHolder: MethodInvocationHolder) -> Void) {
    self.procedure = procedure
    self.onMethodInvocationComplete = onMethodInvocationComplete
  }

  func execute(stateMachineProcedureContext: StateMachineProcedureContext) {
    var isCompleted = false

    procedure.run(procedureContext: ProcedureContext(
      processStateEventCallback: { event in
        assert(!isCompleted, "Cannot set state after procedure completion")
        stateMachineProcedureContext.processStateEvent(event)
      },
      getCurrentStateCallback: {
        assert(!isCompleted, "Cannot get state after procedure completion")
        return stateMachineProcedureContext.getCurrentState()
      },
      resetStateCallback: {
        assert(!isCompleted, "Cannot reset state after procedure completion")
        stateMachineProcedureContext.resetState()
      },
      onCompleteCallback: {
        isCompleted = true
        self.onMethodInvocationComplete(self)
      }
    ))
  }
}

/**
 A serial task queue, where each task is an asynchronous task. Guarantees that all queued tasks
 are run sequentially.
 */
final class StateMachineSerialExecutorQueue {
  private let stateMachineProcedureContext: StateMachineProcedureContext

  required init(stateMachineProcedureContext: StateMachineProcedureContext) {
    self.stateMachineProcedureContext = stateMachineProcedureContext
  }

  private var internalQueue: [MethodInvocationHolder] = []
  private var currentMethodInvocation: MethodInvocationHolder?

  /**
   Queue a procedure for execution.
   */
  func queueExecution(stateMachineProcedure: StateMachineProcedure) {
    internalQueue.append(MethodInvocationHolder(
      procedure: stateMachineProcedure,
      onMethodInvocationComplete: { invocationHolder in
        assert(self.currentMethodInvocation === invocationHolder)
        self.currentMethodInvocation = nil
        self.maybeProcessQueue()
      }
    ))

    maybeProcessQueue()
  }

  private let dispatchQueue = DispatchQueue(label: "expo.statemachine.serialexecutorqueue")

  private func maybeProcessQueue() {
    dispatchQueue.sync {
      if currentMethodInvocation != nil {
        return
      }

      guard let nextMethodInvocation = internalQueue.dequeue() else {
        return
      }
      currentMethodInvocation = nextMethodInvocation
      nextMethodInvocation.execute(stateMachineProcedureContext: stateMachineProcedureContext) // need to make sure this is asynchronous
    }
  }
}

internal extension Array where Element: Any {
  mutating func dequeue() -> Element? {
    guard !self.isEmpty else {
      return nil
    }
    return self.removeFirst()
  }
}
