//  Copyright © 2019 650 Industries. All rights reserved.

internal class StateMachineProcedureContext {
  private let processStateEventCallback: (_ event: UpdatesStateEvent) -> Void
  private let getCurrentStateCallback: () -> UpdatesStateValue
  private let resetStateAfterRestartCallback: () -> Void

  required init(
    processStateEventCallback: @escaping (_ event: UpdatesStateEvent) -> Void,
    getCurrentStateCallback: @escaping () -> UpdatesStateValue,
    resetStateAfterRestartCallback: @escaping () -> Void
  ) {
    self.processStateEventCallback = processStateEventCallback
    self.getCurrentStateCallback = getCurrentStateCallback
    self.resetStateAfterRestartCallback = resetStateAfterRestartCallback
  }

  /**
   Transition the state machine forward to a new state.
   */
  func processStateEvent(_ event: UpdatesStateEvent) {
    self.processStateEventCallback(event)
  }

  /**
   Get the current state.
   */
  @available(*, deprecated, message: "Avoid needing to access current state to know how to transition to next state")
  func getCurrentState() -> UpdatesStateValue {
    return getCurrentStateCallback()
  }

  /**
   Reset the machine to its starting state. Should only be called after the app restarts (reloadAsync()).
   */
  func resetStateAfterRestart() {
    self.resetStateAfterRestartCallback()
  }
}

final class ProcedureContext: StateMachineProcedureContext {
  private let onCompleteCallback: () -> Void

  required init(
    processStateEventCallback: @escaping (UpdatesStateEvent) -> Void,
    getCurrentStateCallback: @escaping () -> UpdatesStateValue,
    resetStateAfterRestartCallback: @escaping () -> Void,
    onCompleteCallback: @escaping () -> Void
  ) {
    self.onCompleteCallback = onCompleteCallback
    super.init(
      processStateEventCallback: processStateEventCallback,
      getCurrentStateCallback: getCurrentStateCallback,
      resetStateAfterRestartCallback: resetStateAfterRestartCallback
    )
  }

  @available(*, unavailable)
  required init(
    processStateEventCallback: @escaping (_ event: UpdatesStateEvent) -> Void,
    getCurrentStateCallback: @escaping () -> UpdatesStateValue,
    resetStateAfterRestartCallback: @escaping () -> Void
  ) {
    fatalError("init(processStateEventCallback:getCurrentStateCallback:resetStateAfterRestartCallback:) has not been implemented")
  }

  /**
   Must be called when the StateMachineProcedure is done updating the state machine. Usually
   at the end of work in the run method.
   */
  func onComplete() {
    self.onCompleteCallback()
  }
}

/**
 Base class for all procedures that transition or reset state on the UpdatesStateMachine.
 State machine state may only be mutated in subclasses of this class to ensure serial
 (well-defined) ordering of state transitions.
 */
protocol StateMachineProcedure {
  func run(procedureContext: ProcedureContext)
  func getLoggerTimerLabel() -> String
}
